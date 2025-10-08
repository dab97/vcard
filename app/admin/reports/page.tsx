"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ru } from "date-fns/locale"; // Импортируем русскую локаль
import { CalendarIcon, FileDown, Users, User } from "lucide-react";
import { DateRange } from "react-day-picker"; // Импортируем DateRange
import { Badge } from "@/components/ui/badge"; // Импортируем компонент Badge

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"; // Импортируем компоненты диалога

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Label } from "@/components/ui/label";
import { StudentStatsCard, type StudentStatsResponse } from "@/components/StudentStatsCard";
import { DIRECTION_OPTIONS } from "@/lib/constants";
import { DataTableFilter } from "@/components/ui/data-table-filter";

interface ReportEntry {
  id: string;
  date: string;
  fio: string;
  reason: string;
  status: "Одобрено" | "Отклонено" | "На рассмотрении";
  group: string;
  direction: string; // Добавляем поле direction
}

import { ArrowUpDown, X } from "lucide-react"; // Импортируем иконки для сортировки и сброса

import { Input } from "@/components/ui/input"; // Импортируем компонент Input для поиска
import { Spinner } from "@/components/ui/spinner"; // Импортируем компонент Spinner

export default function Reports() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState("all");
  const [selectedStatusFilters, setSelectedStatusFilters] = useState<string[]>(
    []
  );
  const [selectedDirectionFilters, setSelectedDirectionFilters] = useState<
    string[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [reportResults, setReportResults] = useState<ReportEntry[]>([]);
  const [sortColumn, setSortColumn] = useState<keyof ReportEntry | null>(
    "date"
  ); // Устанавливаем сортировку по умолчанию по дате
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc"); // Устанавливаем сортировку по умолчанию по убыванию

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<ReportEntry | null>(null);
  const [newStatus, setNewStatus] = useState<ReportEntry["status"] | "">("");
  const [isSaving, setIsSaving] = useState(false); // Добавляем состояние для отслеживания сохранения
  const [isStudentDialogOpen, setIsStudentDialogOpen] = useState(false);
  const [activeStudentName, setActiveStudentName] = useState<string | null>(null);
  const [studentStats, setStudentStats] = useState<StudentStatsResponse | null>(null);
  const [studentStatsLoading, setStudentStatsLoading] = useState(false);
  const [studentStatsError, setStudentStatsError] = useState<string | null>(null);
  const studentStatsAbortRef = useRef<AbortController | null>(null);
  const studentCardContainerRef = useRef<HTMLDivElement | null>(null);

  const groups = useMemo(() => {
    const counts = reportResults.reduce(
      (acc: Record<string, number>, report) => {
        if (report.group && report.group !== "N/A") {
          acc[report.group] = (acc[report.group] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(counts)
      .map(([group, count]) => ({
        value: group,
        label: group,
        count,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "ru"));
  }, [reportResults]);

  const totalGroupCount = useMemo(
    () => groups.reduce((sum, group) => sum + group.count, 0),
    [groups]
  );

  const hasGroups = groups.length > 0;

  useEffect(() => {
    if (selectedGroup !== "all" && !groups.some((group) => group.value === selectedGroup)) {
      setSelectedGroup("all");
    }
  }, [groups, selectedGroup]);

  const students = useMemo(() => {
    const counts = reportResults.reduce(
      (acc: Record<string, number>, report) => {
        if (report.fio && report.fio !== "N/A") {
          acc[report.fio] = (acc[report.fio] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(counts)
      .map(([fio, count]) => ({
        value: fio,
        label: fio,
        count,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "ru"));
  }, [reportResults]);

  const totalStudentCount = useMemo(
    () => students.reduce((sum, student) => sum + student.count, 0),
    [students]
  );

  const hasStudents = students.length > 0;

  useEffect(() => {
    if (selectedStudent !== "all" && !students.some((student) => student.value === selectedStudent)) {
      setSelectedStudent("all");
    }
  }, [students, selectedStudent]);

  const fetchReports = useCallback(async () => {
    const params = new URLSearchParams();
    if (dateRange?.from) {
      params.append("fromDate", format(dateRange.from, "yyyy-MM-dd"));
    }
    if (dateRange?.to) {
      params.append("toDate", format(dateRange.to, "yyyy-MM-dd"));
    }
    if (selectedGroup !== "all") {
      params.append("group", selectedGroup);
    }
    if (selectedStudent !== "all") {
      params.append("student", selectedStudent);
    }
    selectedStatusFilters.forEach((status) => params.append("status", status));
    selectedDirectionFilters.forEach((direction) =>
      params.append("direction", direction)
    );
    if (searchTerm) {
      params.append("searchTerm", searchTerm);
    }

    try {
      const response = await fetch(
        `/api/get-pass-requests?${params.toString()}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: ReportEntry[] = await response.json();
      setReportResults(data);
    } catch (error) {
      console.error("Ошибка при получении отчетов:", error);
      setReportResults([]);
    }
  }, [
    dateRange,
    selectedGroup,
    selectedStudent,
    selectedStatusFilters,
    selectedDirectionFilters,
    searchTerm,
  ]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const statusOptions = useMemo(() => {
    const initialCounts: Record<ReportEntry["status"], number> = {
      Одобрено: 0,
      Отклонено: 0,
      "На рассмотрении": 0,
    };
    const counts = reportResults.reduce(
      (acc: Record<ReportEntry["status"], number>, report) => {
        const statusKey: ReportEntry["status"] = report.status;
        acc[statusKey] = (acc[statusKey] || 0) + 1;
        return acc;
      },
      initialCounts
    );
    return ["Одобрено", "Отклонено", "На рассмотрении"].map((s) => ({
      value: s,
      label: s,
      count: counts[s as ReportEntry["status"]] || 0,
    }));
  }, [reportResults]);

  const directionOptions = useMemo(() => {
    const counts = reportResults.reduce(
      (acc: Record<string, number>, report) => {
        const directionKey: string = report.direction;
        acc[directionKey] = (acc[directionKey] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    return DIRECTION_OPTIONS.map((d) => ({
      value: d.value,
      label: d.label,
      count: counts[d.value] || 0,
    })).filter((direction) => direction.count > 0); // Фильтруем направления с count > 0
  }, [reportResults]);

  useEffect(() => {
    if (selectedDirectionFilters.length === 0) return;
    const allowedDirections = new Set(directionOptions.map((direction) => direction.value));
    const filteredSelections = selectedDirectionFilters.filter((direction) => allowedDirections.has(direction));
    if (filteredSelections.length !== selectedDirectionFilters.length) {
      setSelectedDirectionFilters(filteredSelections);
    }
  }, [directionOptions, selectedDirectionFilters]);

  const handleUpdateStatus = useCallback(async () => {
    if (!editingReport || !newStatus) return;

    setIsSaving(true); // Устанавливаем состояние сохранения в true

    try {
      const response = await fetch(`/api/update-pass-request-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: editingReport.id, status: newStatus }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Обновляем локальное состояние после успешного обновления на сервере
      setReportResults((prevResults) =>
        prevResults.map((report) =>
          report.id === editingReport.id
            ? { ...report, status: newStatus }
            : report
        )
      );
      setIsEditDialogOpen(false);
      setEditingReport(null);
      setNewStatus("");
    } catch (error) {
      console.error("Ошибка при обновлении статуса:", error);
      // Возможно, показать сообщение об ошибке пользователю
    } finally {
      setIsSaving(false); // Сбрасываем состояние сохранения в false
    }
  }, [editingReport, newStatus]);

  const handleSort = (column: keyof ReportEntry) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedReportResults = useMemo(() => {
    let filteredResults = reportResults;

    // Применяем фильтр по статусу
    if (selectedStatusFilters.length > 0) {
      filteredResults = filteredResults.filter((report) =>
        selectedStatusFilters.includes(report.status)
      );
    }

    // Применяем фильтр по поисковому запросу
    if (searchTerm) {
      filteredResults = filteredResults.filter((report) =>
        Object.values(report).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Применяем фильтр по направлению (факультету)
    if (selectedDirectionFilters.length > 0) {
      filteredResults = filteredResults.filter((report) =>
        selectedDirectionFilters.includes(report.direction)
      );
    }

    if (!sortColumn) return filteredResults;

    const sorted = [...filteredResults].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      // Для других типов данных (например, чисел или дат, если они будут добавлены)
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [
    reportResults,
    sortColumn,
    sortDirection,
    selectedStatusFilters,
    selectedDirectionFilters,
    searchTerm,
  ]);

  const handleResetFilters = () => {
    setDateRange(undefined);
    setSelectedGroup("all");
    setSelectedStudent("all");
    setSelectedStatusFilters([]);
    setSelectedDirectionFilters([]);
    setSearchTerm("");
    setSortColumn(null);
    setSortDirection("asc");
    fetchReports(); // Перезагружаем данные после сброса
  };

  const handleEditClick = (report: ReportEntry) => {
    setEditingReport(report);
    setNewStatus(report.status);
    setIsEditDialogOpen(true);
  };

  const handleSaveStatus = () => {
    handleUpdateStatus();
  };

  const fetchStudentStats = useCallback(async (studentName: string) => {
    if (!studentName || studentName === "N/A") return;

    if (studentStatsAbortRef.current) {
      studentStatsAbortRef.current.abort();
    }

    const controller = new AbortController();
    studentStatsAbortRef.current = controller;

    setStudentStatsLoading(true);
    setStudentStats(null);
    setStudentStatsError(null);

    try {
      const response = await fetch(
        `/api/student-stats/${encodeURIComponent(studentName)}`,
        { signal: controller.signal }
      );

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message || "Не удалось загрузить статистику студента");
      }

      const payload: StudentStatsResponse = await response.json();
      if (!controller.signal.aborted) {
        setStudentStats(payload);
      }
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
      setStudentStatsError(
        error instanceof Error ? error.message : "Произошла неизвестная ошибка"
      );
    } finally {
      if (!controller.signal.aborted) {
        setStudentStatsLoading(false);
      }
    }
  }, []);

  const handleViewStudent = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>, studentName: string) => {
      event.stopPropagation();
      if (!studentName || studentName === "N/A") return;
      setActiveStudentName(studentName);
      setIsStudentDialogOpen(true);
      fetchStudentStats(studentName);
    },
    [fetchStudentStats]
  );

  const handleCloseStudentDialog = useCallback((open: boolean) => {
    setIsStudentDialogOpen(open);
    if (!open) {
      if (studentStatsAbortRef.current) {
        studentStatsAbortRef.current.abort();
        studentStatsAbortRef.current = null;
      }
      setActiveStudentName(null);
      setStudentStats(null);
      setStudentStatsError(null);
      setStudentStatsLoading(false);
    }
  }, []);

  const exportToPdf = async () => {
    console.log("Exporting report to PDF...");

    const params = new URLSearchParams();
    if (dateRange?.from) {
      params.append("fromDate", format(dateRange.from, "yyyy-MM-dd"));
    }
    if (dateRange?.to) {
      params.append("toDate", format(dateRange.to, "yyyy-MM-dd"));
    }
    if (selectedGroup !== "all") {
      params.append("group", selectedGroup);
    }
    if (selectedStudent !== "all") {
      params.append("student", selectedStudent);
    }
    selectedStatusFilters.forEach((status) => params.append("status", status));
    selectedDirectionFilters.forEach((direction) =>
      params.append("direction", direction)
    );
    if (searchTerm) {
      params.append("searchTerm", searchTerm);
    }

    try {
      const response = await fetch(`/api/export-pdf?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "report.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      console.log("Report exported to PDF successfully.");
    } catch (error) {
      console.error("Ошибка при экспорте отчета в PDF:", error);
      alert("Не удалось экспортировать отчет в PDF. Пожалуйста, попробуйте еще раз.");
    }
  };

  return (
    <div className="">
      <div className="grid grid-cols-1 md:grid-cols-9 gap-4">
        {/* Фильтры */}
        <Card className="text-xs md:text-sm md:col-span-2 w-full">
          {" "}
          {/* w-full для мобильной версии */}
          <CardHeader>
            <CardTitle className="text-sm">Фильтры Отчета</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs md:text-sm">
            <div>
              <Label className="mb-2">Период: От</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={`w-full justify-start text-left font-normal text-xs md:text-sm ${
                      !dateRange?.from ? "text-muted-foreground" : ""
                    }`}
                  >
                    <CalendarIcon className="h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        `${format(dateRange.from, "dd.MM.yyyy", {
                          locale: ru,
                        })} - ${format(dateRange.to, "dd.MM.yyyy", {
                          locale: ru,
                        })}`
                      ) : (
                        format(dateRange.from, "dd.MM.yyyy", { locale: ru })
                      )
                    ) : (
                      <span>Выберите даты</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={1} // Изменяем количество отображаемых месяцев на 1
                    locale={ru} // Устанавливаем русскую локаль
                    weekStartsOn={1} // Устанавливаем начало недели с понедельника
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label className="mb-2">Выберите группы</Label>
              <Select onValueChange={setSelectedGroup} value={selectedGroup} disabled={!hasGroups}>
                <SelectTrigger className="w-full">
                  <div className="flex w-full items-center gap-2 text-xs md:text-sm">
                    <Users className="size-4 text-muted-foreground" />
                    <SelectValue>
                      <div className="flex w-full items-center justify-between gap-2">
                        <span>
                          {selectedGroup === "all"
                            ? hasGroups
                              ? "Все группы"
                              : "Нет групп с заявками"
                            : groups.find((g) => g.value === selectedGroup)
                                ?.label || ""}
                        </span>
                        <span className="text-muted-foreground ml-auto">
                          {selectedGroup === "all"
                            ? totalGroupCount
                            : groups.find((g) => g.value === selectedGroup)
                                ?.count || 0}
                        </span>
                      </div>
                    </SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  className="w-full max-w-[calc(100vw-2rem)] "
                >
                  {hasGroups && (
                    <SelectItem
                      value="all"
                      className="relative flex items-center justify-between py-3.5 [&>span]:!absolute [&>span]:!left-2 [&>span]:!right-2"
                    >
                      <span className="flex-grow pl-6">Все группы</span>
                      <span className="text-muted-foreground font-mono ml-auto">
                        {totalGroupCount}
                      </span>
                    </SelectItem>
                  )}
                  {groups.map((g) => (
                    <SelectItem
                      key={g.value}
                      value={g.value}
                      className="relative flex items-center justify-between py-3.5 [&>span]:!absolute [&>span]:!left-2 [&>span]:!right-2"
                    >
                      <span className="flex-grow pl-6 text-xs md:text-sm">
                        {g.label}
                      </span>
                      <span className="text-muted-foreground font-mono ml-auto">
                        {g.count}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2">Выберите студента</Label>
              <Select
                onValueChange={setSelectedStudent}
                value={selectedStudent}
                disabled={!hasStudents}
              >
                <SelectTrigger className="w-full">
                  <div className="flex w-full items-center gap-2 text-xs md:text-sm">
                    <User className="size-4 text-muted-foreground" />
                    <SelectValue>
                      <div className="flex w-full items-center justify-between gap-2">
                        <span>
                          {selectedStudent === "all"
                            ? hasStudents
                              ? "Все студенты"
                              : "Нет студентов с заявками"
                            : students.find((s) => s.value === selectedStudent)
                                ?.label || ""}
                        </span>
                        <span className="text-muted-foreground ml-auto">
                          {selectedStudent === "all"
                            ? totalStudentCount
                            : students.find((s) => s.value === selectedStudent)
                                ?.count || 0}
                        </span>
                      </div>
                    </SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  className="w-full max-w-[calc(100vw-2rem)]"
                >
                  {hasStudents && (
                    <SelectItem
                      value="all"
                      className="relative flex items-center justify-between py-3.5 [&>span]:!absolute [&>span]:!left-2 [&>span]:!right-2"
                    >
                      <span className="flex-grow pl-6">Все студенты</span>
                      <span className="text-muted-foreground font-mono ml-auto">
                        {totalStudentCount}
                      </span>
                    </SelectItem>
                  )}
                  {students.map((s) => (
                    <SelectItem
                      key={s.value}
                      value={s.value}
                      className="relative flex items-center justify-between py-3.5 [&>span]:!absolute [&>span]:!left-2 [&>span]:!right-2"
                    >
                      <span className="flex-grow pl-6 text-xs md:text-sm">
                        {s.label}
                      </span>
                      <span className="text-muted-foreground font-mono ml-auto">
                        {s.count}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full" onClick={fetchReports}>
              Сформировать Отчет
            </Button>
          </CardContent>
        </Card>

        {/* Результаты отчета */}
        <Card className="text-xs md:text-sm md:col-span-7 w-full">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
            <CardTitle className="text-sm">Результаты Отчета</CardTitle>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
              <Input
                placeholder="Поиск по таблице..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-primary w-full sm:w-auto text-xs md:text-sm"
              />
              <DataTableFilter
                title="Направление"
                options={directionOptions}
                selectedValues={selectedDirectionFilters}
                onValueChange={setSelectedDirectionFilters}
              />
              <DataTableFilter
                title="Статус"
                options={statusOptions}
                selectedValues={selectedStatusFilters}
                onValueChange={setSelectedStatusFilters}
              />
              {(selectedStatusFilters.length > 0 ||
                selectedDirectionFilters.length > 0 ||
                searchTerm) && (
                <Button
                  variant="ghost"
                  onClick={handleResetFilters}
                  className="px-2 lg:px-3 w-full sm:w-auto"
                >
                  Сбросить <X className="ml-2 h-4 w-4" />
                </Button>
              )}
              {reportResults.length > 0 && (
                <Button
                  variant="outline"
                  onClick={exportToPdf}
                  className="w-full sm:w-auto text-xs md:text-sm"
                >
                  <FileDown className="h-4 w-4" /> Экспортировать в PDF
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {reportResults.length > 0 ? (
              <div className="rounded-md border overflow-x-auto">
                <Table className="text-xs md:text-sm">
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        onClick={() => handleSort("date")}
                        className="cursor-pointer px-4 min-w-[150px]"
                      >
                        Дата Заявки{" "}
                        {sortColumn === "date" && (
                          <ArrowUpDown
                            className={`ml-2 h-4 w-4 inline ${
                              sortDirection === "desc" ? "rotate-180" : ""
                            }`}
                          />
                        )}
                      </TableHead>
                      <TableHead
                        onClick={() => handleSort("fio")}
                        className="cursor-pointer px-4 min-w-[200px]"
                      >
                        ФИО Студента{" "}
                        {sortColumn === "fio" && (
                          <ArrowUpDown
                            className={`ml-2 h-4 w-4 inline ${
                              sortDirection === "desc" ? "rotate-180" : ""
                            }`}
                          />
                        )}
                      </TableHead>
                      <TableHead
                        onClick={() => handleSort("group")}
                        className="cursor-pointer px-4 min-w-[150px]"
                      >
                        Группа{" "}
                        {sortColumn === "group" && (
                          <ArrowUpDown
                            className={`ml-2 h-4 w-4 inline ${
                              sortDirection === "desc" ? "rotate-180" : ""
                            }`}
                          />
                        )}
                      </TableHead>
                      <TableHead
                        onClick={() => handleSort("reason")}
                        className="cursor-pointer px-4 min-w-[150px]"
                      >
                        Причина{" "}
                        {sortColumn === "reason" && (
                          <ArrowUpDown
                            className={`ml-2 h-4 w-4 inline ${
                              sortDirection === "desc" ? "rotate-180" : ""
                            }`}
                          />
                        )}
                      </TableHead>
                      <TableHead
                        onClick={() => handleSort("status")}
                        className="cursor-pointer text-end px-4 min-w-[120px]"
                      >
                        Статус{" "}
                        {sortColumn === "status" && (
                          <ArrowUpDown
                            className={`ml-2 h-4 w-4 inline ${
                              sortDirection === "desc" ? "rotate-180" : ""
                            }`}
                          />
                        )}
                      </TableHead>
                      <TableHead className="px-4 text-end min-w-[130px]">
                        Действия
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedReportResults.map((entry) => (
                      <TableRow
                        key={entry.id}
                        onClick={() => handleEditClick(entry)}
                        className="cursor-pointer hover:bg-gray-100"
                      >
                        <TableCell className="px-4 whitespace-nowrap">
                          {entry.date !== "N/A"
                            ? format(new Date(entry.date), "dd.MM.yyyy HH:mm", {
                                locale: ru,
                              })
                            : "N/A"}
                        </TableCell>
                        <TableCell className="px-4 whitespace-nowrap">
                          {entry.fio}
                        </TableCell>
                        <TableCell className="px-4 whitespace-nowrap">
                          {entry.group}
                        </TableCell>
                        <TableCell className="px-4 whitespace-nowrap">
                          {entry.reason}
                        </TableCell>
                        <TableCell className="text-end px-4 whitespace-nowrap">
                          <Badge
                            className={
                              entry.status === "Одобрено"
                                ? "bg-green-500"
                                : entry.status === "Отклонено"
                                ? "bg-red-500"
                                : "bg-yellow-500"
                            }
                          >
                            {entry.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 text-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs md:text-sm"
                            onClick={(event) => handleViewStudent(event, entry.fio)}
                          >
                            Карточка
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-gray-500">
                Сформируйте отчет, используя фильтры слева.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Диалог карточки студента */}
      <Dialog open={isStudentDialogOpen} onOpenChange={handleCloseStudentDialog}>
        <DialogContent className="max-w-[90vw] sm:max-w-4xl border-none bg-transparent p-0 shadow-none">
          {studentStatsLoading ? (
            <div className="flex min-h-[220px] items-center justify-center rounded-2xl bg-background p-8 shadow-lg">
              <Spinner className="h-6 w-6" />
            </div>
          ) : studentStatsError ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 rounded-2xl bg-background p-8 text-center shadow-lg">
              <p className="text-sm text-muted-foreground">{studentStatsError}</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" onClick={() => activeStudentName && fetchStudentStats(activeStudentName)}>
                  Повторить загрузку
                </Button>
                <Button onClick={() => handleCloseStudentDialog(false)}>Закрыть</Button>
              </div>
            </div>
          ) : studentStats ? (
            <div ref={studentCardContainerRef} className="max-h-[80vh] p-6">
              <StudentStatsCard
                data={studentStats}
                onScrollToHistory={() => {
                  const target = studentCardContainerRef.current?.querySelector(
                    "#student-requests-table"
                  );
                  target?.scrollIntoView({ behavior: "smooth" });
                }}
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Диалог редактирования статуса */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[90vw] w-full p-4 sm:max-w-lg sm:p-6 text-xs md:text-sm">
          {" "}
          {/* Адаптивная ширина и отступы */}
          <DialogHeader>
            <DialogTitle className="text-lg">
              Изменить статус заявки
            </DialogTitle>{" "}
            {/* Адаптивный размер шрифта */}
          </DialogHeader>
          {editingReport && (
            <div className="grid gap-4 py-4">
              {" "}
              {/* Адаптивный размер шрифта для содержимого */}
              <div className="grid grid-cols-4 sm:grid-cols-4 items-center gap-4">
                <Label htmlFor="fio" className="col-span-1 sm:text-right">
                  ФИО
                </Label>
                <p className="col-span-3 sm:col-span-3 break-words">
                  {editingReport.fio}
                </p>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-4 items-center gap-4">
                <Label htmlFor="group" className="sm:text-right">
                  Группа
                </Label>
                <p className="col-span-3 sm:col-span-3 break-words">
                  {editingReport.group}
                </p>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-4 items-center gap-4">
                <Label htmlFor="reason" className="sm:text-right">
                  Причина
                </Label>
                <p className="col-span-3 sm:col-span-3 break-words">
                  {editingReport.reason}
                </p>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="sm:text-right">
                  Статус
                </Label>
                <Select
                  onValueChange={(value) =>
                    setNewStatus(value as ReportEntry["status"])
                  }
                  value={newStatus}
                >
                  <SelectTrigger className="col-span-1 sm:col-span-3">
                    <SelectValue placeholder="Выберите статус" />
                  </SelectTrigger>
                  <SelectContent className="text-xs md:text-sm col-span-3 w-full">
                    <SelectItem value="Одобрено">Одобрено</SelectItem>
                    <SelectItem value="Отклонено">Отклонено</SelectItem>
                    <SelectItem value="На рассмотрении">
                      На рассмотрении
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={handleSaveStatus}
              disabled={isSaving}
              className="w-full sm:w-auto"
            >
              {isSaving ? <Spinner className="mr-2" /> : null}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
