"use client";

import { useState } from "react";
import React from "react";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export interface PDFExportProps {
  children: (props: { formattedDateRange: string | null }) => React.ReactNode;
  reportTitle: string;
  dateRange?: DateRange;
}

export default function PDFExport({ children, reportTitle, dateRange }: PDFExportProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formattedDateRange = dateRange?.from
    ? dateRange.to
      ? `за период с ${format(dateRange.from, "dd.MM.yyyy", { locale: ru })} по ${format(dateRange.to, "dd.MM.yyyy", { locale: ru })}`
      : `за ${format(dateRange.from, "dd.MM.yyyy", { locale: ru })}`
    : null;

  const handleExport = async () => {
    setLoading(true);
    setError(null);

    try {
      const content = document.getElementById("pdf-content");
      if (!content) {
        throw new Error("Content not found");
      }

      let styles = "";
      for (const styleSheet of document.styleSheets) {
        try {
          if (styleSheet.cssRules) {
            for (const cssRule of styleSheet.cssRules) {
              styles += cssRule.cssText;
            }
          }
        } catch (e) {
          console.warn("Не удалось прочитать таблицу стилей:", styleSheet.href, e);
        }
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 10px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                border: 1px solid #e2e8f0;
              }
              th, td {
                border: 1px solid #e2e8f0;
                padding: 4px;
                font-size: 10px;
              }
              th {
                background-color: #f8f8f8;
                font-weight: bold;
                font-size: 11px;
                text-align: center; /* Все заголовки по центру */
              }
              /* Выравнивание по центру для содержимого столбцов "Дата Заявки" и "Статус" */
              td:nth-child(1),
              td:nth-child(5) {
                text-align: center;
              }
              /* Выравнивание по левому краю для содержимого столбцов "ФИО Студента", "Группа", "Причина" */
              td:nth-child(2),
              td:nth-child(3),
              td:nth-child(4) {
                text-align: left;
              }
              thead {
                display: table-header-group;
              }
              .pdf-content-wrapper {
                text-align: center;
                margin-bottom: 20px;
              }
              .report-main-title {
                font-size: 24px;
                font-weight: bold;                
              }
              .report-date-range {
                font-size: 14px;
                color: #555;                
                margin-bottom: 12px;
              }
              ${styles}
            </style>
          </head>
          <body>
            ${content.innerHTML}
          </body>
        </html>
      `;

      const response = await fetch("/api/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ html: htmlContent }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportTitle}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div id="pdf-content" style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
        {children({ formattedDateRange })}
      </div>

      <Button
        onClick={handleExport}
        disabled={loading}
      >
        {loading ? (
          <>
            <FileDown className="h-4 w-4" /> Генерация PDF...
          </>
        ) : (
          <>
            <FileDown className="h-4 w-4" /> Экспорт в PDF
          </>
        )}
      </Button>

      {error && (
        <div style={{ marginTop: "10px", color: "red" }}>
          Ошибка: {error}
        </div>
      )}
    </>
  );
}
