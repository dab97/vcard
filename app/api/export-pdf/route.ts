import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const group = searchParams.get('group');
    const student = searchParams.get('student');
    const statuses = searchParams.getAll('status');
    const directions = searchParams.getAll('direction');
    const searchTerm = searchParams.get('searchTerm');

    // Fetch data based on filters (similar to get-pass-requests)
    const reportParams = new URLSearchParams();
    if (fromDate) reportParams.append('fromDate', fromDate);
    if (toDate) reportParams.append('toDate', toDate);
    if (group && group !== 'all') reportParams.append('group', group);
    if (student && student !== 'all') reportParams.append('student', student);
    statuses.forEach(s => reportParams.append('status', s));
    directions.forEach(d => reportParams.append('direction', d));
    if (searchTerm) reportParams.append('searchTerm', searchTerm);

    const reportResponse = await fetch(`${req.nextUrl.origin}/api/get-pass-requests?${reportParams.toString()}`);
    if (!reportResponse.ok) {
      throw new Error(`Failed to fetch report data: ${reportResponse.statusText}`);
    }
    const reportData = await reportResponse.json();

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Отчет по заявкам</title>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Arial', sans-serif; margin: 20px; font-size: 10px; }
          h1 { font-size: 18px; text-align: center; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            color: white;
            font-size: 9px;
          }
          .badge-approved { background-color: #28a745; } /* Green */
          .badge-rejected { background-color: #dc3545; } /* Red */
          .badge-pending { background-color: #ffc107; } /* Yellow */
        </style>
      </head>
      <body>
        <h1>Отчет по заявкам${fromDate && toDate ? ` за период с ${format(new Date(fromDate), 'dd.MM.yyyy', { locale: ru })} по ${format(new Date(toDate), 'dd.MM.yyyy', { locale: ru })}` : ''}</h1>
        <table>
          <thead>
            <tr>
              <th>Дата Заявки</th>
              <th>ФИО Студента</th>
              <th>Группа</th>
              <th>Причина</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
    `;

    reportData.forEach((entry: any) => {
      const statusClass =
        entry.status === 'Одобрено'
          ? 'badge-approved'
          : entry.status === 'Отклонено'
          ? 'badge-rejected'
          : 'badge-pending';

      htmlContent += `
        <tr>
          <td>${entry.date !== 'N/A' ? format(new Date(entry.date), 'dd.MM.yyyy HH:mm', { locale: ru }) : 'N/A'}</td>
          <td>${entry.fio}</td>
          <td>${entry.group}</td>
          <td>${entry.reason}</td>
          <td><span class="badge ${statusClass}">${entry.status}</span></td>
        </tr>
      `;
    });

    htmlContent += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    console.log(`Generated PDF buffer size: ${pdfBuffer.length} bytes`);

    await browser.close();

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="report.pdf"',
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
