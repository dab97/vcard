import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { html } = await request.json();

  let browser;
  try {
    // Определяем окружение
    const isVercel = !!process.env.VERCEL_ENV;
    
    let puppeteer: any;
    let launchOptions: any = {
      headless: true,
    };

    if (isVercel) {
      // Настройка для Vercel (production)
      const chromium = (await import("@sparticuz/chromium")).default;
      puppeteer = await import("puppeteer-core");
      
      launchOptions = {
        ...launchOptions,
        args: chromium.args,
        executablePath: await chromium.executablePath(),
      };
    } else {
      // Настройка для локальной разработки
      puppeteer = await import("puppeteer");
      // executablePath определяется автоматически
    }

    // Запуск браузера
    browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();

    // Установка HTML контента
    await page.setContent(html, { 
      waitUntil: "networkidle0" 
    });

    // Генерация PDF
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "16px",
        right: "16px",
        bottom: "16px",
        left: "16px",
      },
    });

    // Возврат PDF
    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="document.pdf"',
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return new NextResponse(
      JSON.stringify({ 
        error: "PDF generation failed",
        details: error instanceof Error ? error.message : "Unknown error"
      }), 
      { 
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Для Vercel Pro/Enterprise можно увеличить таймаут
// export const maxDuration = 60; // секунды
