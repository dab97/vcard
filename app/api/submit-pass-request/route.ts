import { Client } from "@notionhq/client";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

export async function POST(request: Request) {
  if (!databaseId) {
    return NextResponse.json(
      { message: "NOTION_DATABASE_ID не установлен" },
      { status: 500 }
    );
  }

  try {
    const { direction, group, studentFio, reason } = await request.json();
    console.log("Полученные данные формы:", { direction, group, studentFio, reason });

    // Проверка существования студента в Supabase
    const { data: students, error: studentError } = await supabase
      .from('students')
      .select('name, group')
      .eq('name', studentFio)
      .eq('group', group);

    if (studentError) {
      console.error('Ошибка при проверке студента в Supabase:', studentError);
      return NextResponse.json(
        { message: 'Ошибка при проверке студента', details: studentError.message },
        { status: 500 }
      );
    }

    if (!students || students.length === 0) {
      return NextResponse.json(
        { message: `Студент "${studentFio}" в группе "${group}" не найден.` },
        { status: 404 }
      );
    }

    await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        "ФИО Студента": {
          title: [
            {
              text: {
                content: studentFio,
              },
            },
          ],
        },
        "Направление": {
          select: {
            name: direction,
          },
        },
        "Группа": {
          select: {
            name: group,
          },
        },
        "Причина": {
          select: {
            name: reason,
          },
        },
        "Дата Отправки": {
          date: {
            start: new Date().toISOString().split("T")[0],
          },
        },
        "Статус": { // Добавляем поле "Статус"
          select: {
            name: "На рассмотрении", // Устанавливаем значение по умолчанию
          },
        },
      },
    });

    return NextResponse.json({ message: "Заявка успешно отправлена в Notion" }, { status: 200 });
  } catch (error: any) {
    console.error("Ошибка при отправке в Notion:", error.body || error);
    return NextResponse.json(
      { message: "Ошибка при отправке заявки в Notion", details: error.body || error.message },
      { status: 500 }
    );
  }
}
