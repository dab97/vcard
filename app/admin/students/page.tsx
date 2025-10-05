"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent } from "@/components/ui/card";
import { StudentPageSkeleton } from "@/components/StudentPageSkeleton";

interface Student {
  id: string;
  fullName: string;
  major: string;
  group: string;
}

export const columns: ColumnDef<Student>[] = [
  {
    accessorKey: "fullName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          ФИО
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div>{row.getValue("fullName")}</div>,
  },
  {
    accessorKey: "major",
    header: "Направление",
    cell: ({ row }) => <div>{row.getValue("major")}</div>,
  },
  {
    accessorKey: "group",
    header: "Группа",
    cell: ({ row }) => <div>{row.getValue("group")}</div>,
  },
];

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("all");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 15, // Здесь задается размер отображения строк для таблицы
  });

  useEffect(() => {
    async function fetchStudents() {
      try {
        setLoading(true);
        const response = await fetch("/api/students");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        const fetchedStudents: Student[] = data.students.map((s: any, index: number) => ({
          id: `${index + 1}`,
          fullName: s.label,
          major: s.direction,
          group: s.group,
        }));
        setStudents(fetchedStudents);
      } catch (e: any) {
        setError(e.message);
        console.error("Ошибка при загрузке студентов:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchStudents();
  }, []);

  const table = useReactTable({
    data: students,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination, // Добавляем обработчик изменения пагинации
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
      rowSelection,
      pagination, // Добавляем состояние пагинации
    },
  });

  const majors = useMemo(() => {
    const majorCounts: { [key: string]: number } = {};
    students.forEach((student) => {
      if (!majorCounts[student.major]) {
        majorCounts[student.major] = 0;
      }
      majorCounts[student.major]++;
    });
    const uniqueMajors = Array.from(
      new Set(students.map((student) => student.major))
    ).sort(); // Сортировка по алфавиту
    return [
      { value: "all", label: "Все направления", count: students.length },
      ...uniqueMajors.map((major) => ({
        value: major,
        label: major,
        count: majorCounts[major],
      })),
    ];
  }, [students]);

  const groups = useMemo(() => {
    const filteredStudents =
      selectedMajor === "all"
        ? students
        : students.filter((student) => student.major === selectedMajor);

    const groupCounts: { [key: string]: number } = {};
    filteredStudents.forEach((student) => {
      if (!groupCounts[student.group]) {
        groupCounts[student.group] = 0;
      }
      groupCounts[student.group]++;
    });

    const uniqueGroups = Array.from(
      new Set(filteredStudents.map((student) => student.group))
    ).sort(); // Сортировка по алфавиту
    return [
      {
        value: "all",
        label: "Все группы",
        count: filteredStudents.length,
      },
      ...uniqueGroups.map((group) => ({
        value: group,
        label: group,
        count: groupCounts[group],
      })),
    ];
  }, [students, selectedMajor]);

  if (loading) {
    return <StudentPageSkeleton />;
  }

  if (error) {
    return <div className="text-red-500 text-center">Ошибка: {error}</div>;
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center pb-4 gap-4">
          <Input
            placeholder="Поиск по всем полям..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="w-full sm:max-w-sm text-xs md:text-sm"
          />
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto ml-auto">
            <Select
              onValueChange={(value) => {
                table
                  .getColumn("major")
                  ?.setFilterValue(value === "all" ? "" : value);
                setSelectedMajor(value);
                table.getColumn("group")?.setFilterValue(""); // Сбрасываем фильтр группы
              }}              
            >
              <SelectTrigger className="w-full sm:w-[220px] text-xs md:text-sm">
                <SelectValue placeholder="Направление" />
              </SelectTrigger>
              <SelectContent>
                {majors.map((major) => (
                  <SelectItem key={major.value} value={major.value}>
                    <div className="flex w-full items-center justify-between gap-2 text-xs md:text-sm">
                      <span>{major.label}</span>
                      <span className="text-muted-foreground font-mono ml-auto">
                        {major.count}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              onValueChange={(value) =>
                table
                  .getColumn("group")
                  ?.setFilterValue(value === "all" ? "" : value)
              }
            >
              <SelectTrigger className="w-full sm:w-[220px] text-xs md:text-sm">
                <SelectValue placeholder="Группа" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group.value} value={group.value}>
                    <div className="flex w-full items-center justify-between gap-2 text-xs md:text-sm">
                      <span>{group.label}</span>
                      <span className="text-muted-foreground font-mono ml-auto">
                        {group.count}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="rounded-md border overflow-x-auto">
          <Table className="text-xs md:text-sm">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    Студенты не найдены.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="flex-1 text-xs md:text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} из{" "}
            {table.getFilteredRowModel().rows.length} строк выбрано.
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="text-xs md:text-sm"
            >
              Назад
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="text-xs md:text-sm"
            >
              Вперед
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
