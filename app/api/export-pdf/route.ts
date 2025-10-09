import { NextRequest, NextResponse } from 'next/server';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

// Указываем максимальное время выполнения для Vercel
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async GET(req: NextRequest) {
  let browser;
  
  try {
    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const group = searchParams.get('group');
    const student = searchParams.get('student');
    const statuses = searchParams.getAll('status');
    const directions = searchParams.getAll('direction');
    const searchTerm = searchParams.get('searchTerm');

    console.log('🚀 Starting PDF generation');

    // Fetch data based on filters
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
    console.log(`✅ Fetched ${reportData.length} records`);

    // Определяем окружение и загружаем нужные пакеты
    const isVercel = !!process.env.VERCEL_ENV;
    console.log(`🌍 Environment: ${isVercel ? 'Vercel' : 'Local'}`);

    let puppeteer: any;
    let launchOptions: any = {
      headless: true,
    };

    if (isVercel) {
      // Для Vercel (production)
      console.log('📦 Loading Vercel dependencies...');
      const chromium = (await import('@sparticuz/chromium')).default;
      puppeteer = await import('puppeteer-core');
      
      launchOptions = {
        args: [
          ...chromium.args,
          '--hide-scrollbars',
          '--disable-web-security',
          '--disable-gpu',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--single-process'
        ],
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      };
    } else {
      // Для локальной разработки
      console.log('📦 Loading local Puppeteer...');
      puppeteer = await import('puppeteer');
      
      launchOptions = {
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--hide-scrollbars',
          '--disable-web-security'
        ],
        defaultViewport: { width: 1280, height: 720 },
        headless: true,
      };
    }

    console.log('🌐 Launching browser...');
    browser = await puppeteer.launch(launchOptions);
    console.log('✅ Browser launched');

    const page = await browser.newPage();

    // Генерация HTML контента
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Отчет по заявкам</title>
        <meta charset="UTF-8">
        <style>
          body { 
            font-family: 'Arial', sans-serif; 
            margin: 20px; 
            font-size: 10px; 
          }
          h1 { 
            font-size: 18px; 
            text-align: center; 
            margin-bottom: 20px; 
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px; 
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left; 
          }
          th { 
            background-color: #f2f2f2; 
            font-weight: bold;
          }
          .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            color: white;
            font-size: 9px;
            font-weight: bold;
          }
          .badge-approved { background-color: #28a745; }
          .badge-rejected { background-color: #dc3545; }
          .badge-pending { background-color: #ffc107; color: #000; }
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

    console.log('📄 Setting HTML content...');
    await page.setContent(htmlContent, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    console.log('✅ Content set');

    console.log('🖨️ Generating PDF...');
    const pdfBuffer = await page.pdf({ 
      format: 'A4', 
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      }
    });
    console.log(`✅ Generated PDF buffer size: ${pdfBuffer.length} bytes`);

    await browser.close();
    console.log('🧹 Browser closed');

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="report.pdf"',
      },
    });
  } catch (error: any) {
    console.error('❌ Error generating PDF:', error);
    console.error('Error stack:', error.stack);
    
    if (browser) {
      try {
        await browser.close();
        console.log('🧹 Browser cleanup completed');
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to generate PDF',
        message: error.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }, 
      { status: 500 }
    );
  }
}
