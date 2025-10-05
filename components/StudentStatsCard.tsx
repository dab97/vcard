"use client";

import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { FileText, GraduationCap, Users2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface StudentSummary {
  name: string;
  group: string;
  direction: string;
  totalRequests: number;
  statusCounts: Record<string, number>;
  reasonCounts: Record<string, number>;
  firstRequestDate: string | null;
  lastRequestDate: string | null;
}

export interface StudentRequest {
  id: string;
  date: string;
  fio: string;
  reason: string;
  status: "Одобрено" | "Отклонено" | "На рассмотрении" | "N/A";
  group: string;
  direction: string;
}

export interface StudentStatsResponse {
  summary: StudentSummary;
  requests: StudentRequest[];
}

interface StudentStatsCardProps {
  data: StudentStatsResponse;
  onScrollToHistory?: () => void;
}

const formatDate = (value: string | null) => {
  if (!value || value === "N/A") return "Нет данных";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return format(parsed, "dd MMMM yyyy HH:mm", { locale: ru });
};

export function StudentStatsCard({ data, onScrollToHistory }: StudentStatsCardProps) {
  const { summary, requests } = data;
  const reasonEntries = Object.entries(summary.reasonCounts).sort(
    (a, b) => b[1] - a[1]
  );

  return (
    <Card className="mx-auto w-full overflow-hidden border-none pt-0">
      <div className="bg-gradient-to-r from-primary/95 to-primary/80 px-5 py-5 text-primary-foreground">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-primary-foreground/80">
              <GraduationCap className="h-3.5 w-3.5" /> Карточка студента
            </div>
            <h1 className="text-xl font-semibold leading-tight text-white sm:text-2xl">
              {summary.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/85">
              <Badge variant="outline" className="border-white/30 bg-white/10 px-2 py-1 text-[10px] font-medium text-white">
                Группа: {summary.group}
              </Badge>
              <Badge variant="outline" className="border-white/30 bg-white/10 px-2 py-1 text-[10px] font-medium text-white">
                Направление: {summary.direction}
              </Badge>
              <span>Первая заявка: {formatDate(summary.firstRequestDate)}</span>
            </div>
          </div>
          <div className="rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-center text-white">
            <p className="text-[10px] uppercase tracking-wide opacity-80">
              Последняя заявка
            </p>
            <p className="mt-1 text-sm font-medium leading-none">
              {formatDate(summary.lastRequestDate)}
            </p>
          </div>
        </div>
      </div>

      <CardContent className="space-y-4 p-4 text-[12px] leading-relaxed text-foreground/90">
        <div className="grid gap-2 sm:grid-cols-4">
          <div className="rounded-lg border border-border/70 bg-muted/30 px-4 py-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Всего заявок
            </p>
            <p className="mt-1 text-xl font-semibold text-foreground">
              {summary.totalRequests}
            </p>
          </div>
          {Object.entries(summary.statusCounts).map(([status, count]) => (
            <div
              key={status}
              className="rounded-lg border border-border/70 bg-muted/20 px-4 py-3"
            >
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {status}
              </p>
              <p className="mt-1 text-lg font-semibold text-foreground">{count}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Частые причины
            </h2>
            <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1 text-[10px]">
              <Users2 className="h-3 w-3" /> {summary.totalRequests}
            </Badge>
          </div>
          {reasonEntries.length > 0 ? (
            <ul className="space-y-1.5">
              {reasonEntries.map(([reason, count]) => {
                const percentage = Math.round((count / summary.totalRequests) * 100);
                return (
                  <li
                    key={reason}
                    className="flex items-center justify-between rounded-md border border-border/60 bg-muted/20 px-3 py-2"
                  >
                    <span className="truncate text-[12px] font-medium">{reason}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {count} • {percentage}%
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              Причины ещё не собраны.
            </p>
          )}
        </div>

        <Separator className="opacity-60" />

        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Последние обращения
            </h2>
            {requests.length > 2 ? (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 px-2 py-1 text-[11px]"
                onClick={onScrollToHistory}
              >
                <FileText className="h-3 w-3" /> История
              </Button>
            ) : null}
          </div>
          <div className="space-y-1.5">
            {requests.slice(0, 2).map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between rounded-md border border-border/60 bg-background px-3 py-2"
              >
                <div className="pr-3">
                  <p className="text-[12px] font-medium text-foreground">
                    {formatDate(request.date)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Причина: {request.reason}
                  </p>
                </div>
                <Badge
                  className={
                    request.status === "Одобрено"
                      ? "bg-green-500"
                      : request.status === "Отклонено"
                      ? "bg-red-500"
                      : "bg-yellow-500"
                  }
                >
                  {request.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <Separator className="opacity-60" />

        <div id="student-requests-table" className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            История заявок
          </h2>
          <div className="rounded-md border border-border/60">
            <div className="max-h-32 overflow-auto">
              <Table className="text-[11px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[140px]">Дата</TableHead>
                    <TableHead className="min-w-[100px]">Статус</TableHead>
                    <TableHead className="min-w-[140px]">Причина</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{formatDate(request.date)}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            request.status === "Одобрено"
                              ? "bg-green-500"
                              : request.status === "Отклонено"
                              ? "bg-red-500"
                              : "bg-yellow-500"
                          }
                        >
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{request.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
