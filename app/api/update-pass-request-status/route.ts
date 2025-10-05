import { Client } from "@notionhq/client";
import { NextResponse } from "next/server";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export async function POST(request: Request) {
  const { id, status } = await request.json();

  if (!id || !status) {
    return NextResponse.json(
      { message: "Отсутствует ID заявки или статус" },
      { status: 400 }
    );
  }

  try {
    await notion.pages.update({
      page_id: id,
      properties: {
        "Статус": {
          select: {
            name: status,
          },
        },
      },
    });

    return NextResponse.json({ message: "Статус заявки успешно обновлен" }, { status: 200 });
  } catch (error: any) {
    console.error("Ошибка при обновлении статуса в Notion:", error.body || error);
    return NextResponse.json(
      { message: "Ошибка при обновлении статуса заявки в Notion", details: error.body || error.message },
      { status: 500 }
    );
  }
}
