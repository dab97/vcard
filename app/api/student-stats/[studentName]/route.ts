import { NextResponse } from "next/server";
import { Client, isFullPage } from "@notionhq/client"; // Добавляем isFullPage

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

type NotionQueryResponse = Awaited<ReturnType<typeof notion.databases.query>>;
type NotionPage = NotionQueryResponse["results"][number];

interface NotionPassRequest {
  id: string;
  date: string;
  fio: string;
  reason: string;
  status: "Одобрено" | "Отклонено" | "На рассмотрении" | "N/A";
  group: string;
  direction: string;
}

const DEFAULT_STATUS_COUNTS = {
  Одобрено: 0,
  Отклонено: 0,
  "На рассмотрении": 0,
};

export async function GET(
  _request: Request,
  { params }: { params: { studentName: string } }
) {
  if (!databaseId) {
    return NextResponse.json(
      { message: "NOTION_DATABASE_ID не установлен" },
      { status: 500 }
    );
  }

  // Ensure params are awaited before use, as suggested by Next.js warning
  const resolvedParams = await Promise.resolve(params);
  const studentName = decodeURIComponent(resolvedParams.studentName);

  if (!studentName) {
    return NextResponse.json(
      { message: "Не передано имя студента" },
      { status: 400 }
    );
  }

  try {
    const filter = {
      property: "ФИО Студента",
      title: {
        contains: studentName,
      },
    } as const;

    const results: NotionQueryResponse["results"] = [];
    let hasMore = true;
    let startCursor: string | undefined = undefined;

    while (hasMore) {
      const queryOptions: Parameters<typeof notion.databases.query>[0] = {
        database_id: databaseId,
        filter,
        sorts: [
          {
            property: "Дата Отправки",
            direction: "descending",
          },
        ],
      };

      if (startCursor) {
        queryOptions.start_cursor = startCursor;
      }

      const response = await notion.databases.query(queryOptions);

      results.push(...response.results);
      hasMore = response.has_more;
      startCursor = response.next_cursor ?? undefined;
    }

    if (results.length === 0) {
      return NextResponse.json(
        { message: "Заявки для указанного студента не найдены" },
        { status: 404 }
      );
    }

    const requests: NotionPassRequest[] = results
      .map((page) => {
        if (!isFullPage(page)) {
          console.warn("Получен частичный объект страницы, пропускаем:", page);
          return null;
        }

        const statusProperty = page.properties["Статус"];
        const statusName =
          statusProperty?.type === "select"
            ? statusProperty.select?.name
            : undefined;

        const dateProperty = page.properties["Дата Отправки"];
        const dateStart =
          dateProperty?.type === "date" ? dateProperty.date?.start : undefined;

        const fioProperty = page.properties["ФИО Студента"];
        const fioText =
          fioProperty?.type === "title"
            ? fioProperty.title?.[0]?.plain_text
            : undefined;

        const reasonProperty = page.properties["Причина"];
        const reasonName =
          reasonProperty?.type === "select"
            ? reasonProperty.select?.name
            : undefined;

        const groupProperty = page.properties["Группа"];
        const groupName =
          groupProperty?.type === "select"
            ? groupProperty.select?.name
            : undefined;

        const directionProperty = page.properties["Направление"];
        const directionName =
          directionProperty?.type === "select"
            ? directionProperty.select?.name
            : undefined;

        return {
          id: page.id,
          date: dateStart || page.created_time || "N/A",
          fio: fioText || "N/A",
          reason: reasonName || "Прочее",
          status:
            statusName &&
            ["Одобрено", "Отклонено", "На рассмотрении"].includes(statusName)
              ? (statusName as NotionPassRequest["status"])
              : "На рассмотрении",
          group: groupName || "N/A",
          direction: directionName || "N/A",
        };
      })
      .filter(Boolean) as NotionPassRequest[];

    const statusCounts = requests.reduce(
      (acc, request) => {
        if (request.status in acc) {
          acc[request.status as keyof typeof acc] += 1;
        }
        return acc;
      },
      { ...DEFAULT_STATUS_COUNTS }
    );

    const reasonCounts = requests.reduce<Record<string, number>>(
      (acc, request) => {
        const reasonKey = request.reason || "Прочее";
        acc[reasonKey] = (acc[reasonKey] || 0) + 1;
        return acc;
      },
      {}
    );

    const sortedByDate = [...requests].sort((a, b) => {
      const dateA = a.date === "N/A" ? 0 : new Date(a.date).getTime();
      const dateB = b.date === "N/A" ? 0 : new Date(b.date).getTime();
      return dateA - dateB;
    });

    const firstRequest = sortedByDate[0];
    const lastRequest = sortedByDate[sortedByDate.length - 1];

    const summary = {
      name: requests[0]?.fio ?? studentName,
      group: requests[0]?.group ?? "N/A",
      direction: requests[0]?.direction ?? "N/A",
      totalRequests: requests.length,
      statusCounts,
      reasonCounts,
      firstRequestDate: firstRequest?.date ?? null,
      lastRequestDate: lastRequest?.date ?? null,
    };

    return NextResponse.json({ summary, requests }, { status: 200 });
  } catch (error: unknown) {
    console.error(
      "Ошибка при получении статистики студента из Notion:",
      (error as { body?: unknown })?.body || error
    );
    return NextResponse.json(
      {
        message: "Ошибка при получении статистики студента",
        details:
          (error as { body?: string })?.body ||
          (error instanceof Error ? error.message : "Неизвестная ошибка"),
      },
      { status: 500 }
    );
  }
}
