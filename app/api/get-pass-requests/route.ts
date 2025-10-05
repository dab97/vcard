import { Client } from "@notionhq/client";
import { NextResponse } from "next/server";

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

export async function GET(request: Request) {
  if (!databaseId) {
    return NextResponse.json(
      { message: "NOTION_DATABASE_ID не установлен" },
      { status: 500 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const groupFilter = searchParams.get("group");
    const studentFilter = searchParams.get("student");
    const statusFilters = searchParams.getAll("status");
    const directionFilters = searchParams.getAll("direction");
    const searchTerm = searchParams.get("searchTerm");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    const filters: any[] = [];

    if (groupFilter && groupFilter !== "all") {
      filters.push({
        property: "Группа",
        select: {
          equals: groupFilter,
        },
      });
    }

    if (studentFilter && studentFilter !== "all") {
      filters.push({
        property: "ФИО Студента",
        title: {
          contains: studentFilter,
        },
      });
    }

    if (statusFilters.length > 0) {
      filters.push({
        or: statusFilters.map((status) => ({
          property: "Статус",
          select: {
            equals: status,
          },
        })),
      });
    }

    if (directionFilters.length > 0) {
      filters.push({
        or: directionFilters.map((direction) => ({
          property: "Направление",
          select: {
            equals: direction,
          },
        })),
      });
    }

    if (searchTerm) {
      filters.push({
        or: [
          {
            property: "ФИО Студента",
            title: {
              contains: searchTerm,
            },
          },
          {
            property: "Группа",
            select: {
              contains: searchTerm,
            },
          },
          {
            property: "Причина",
            select: {
              contains: searchTerm,
            },
          },
          {
            property: "Статус",
            select: {
              contains: searchTerm,
            },
          },
          {
            property: "Направление",
            select: {
              contains: searchTerm,
            },
          },
        ],
      });
    }

    if (fromDate || toDate) {
      const dateFilter: any = {
        property: "Дата Отправки",
        date: {},
      };
      if (fromDate) {
        dateFilter.date.on_or_after = fromDate;
      }
      if (toDate) {
        dateFilter.date.on_or_before = toDate;
      }
      filters.push(dateFilter);
    }

    // @ts-ignore
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        and: filters,
      },
      sorts: [
        {
          property: "Дата Отправки",
          direction: "descending",
        },
      ],
    });

    const passRequests = response.results.map((page: any) => ({
      id: page.id,
      date: page.properties["Дата Отправки"]?.date?.start || page.created_time || "N/A", // Попытка получить дату из created_time
      fio: page.properties["ФИО Студента"]?.title[0]?.plain_text || "N/A",
      reason: page.properties["Причина"]?.select?.name || "N/A",
      status: (["Одобрено", "Отклонено", "На рассмотрении"].includes(page.properties["Статус"]?.select?.name)
        ? page.properties["Статус"]?.select?.name
        : "На рассмотрении"), // Проверяем статус и устанавливаем значение по умолчанию
      group: page.properties["Группа"]?.select?.name || "N/A",
      direction: page.properties["Направление"]?.select?.name || "N/A",
    }));

    return NextResponse.json(passRequests, { status: 200 });
  } catch (error: any) {
    console.error("Ошибка при получении заявок из Notion:", error.body || error);
    return NextResponse.json(
      { message: "Ошибка при получении заявок из Notion", details: error.body || error.message },
      { status: 500 }
    );
  }
}
