"use client"; // Это клиентский компонент, так как использует интерактивность

// Объявления типов для Web Speech API
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }

  interface SpeechRecognition extends EventTarget {
    grammars: SpeechGrammarList;
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    serviceURI: string;

    onaudiostart: (this: SpeechRecognition, ev: Event) => any;
    onaudioend: (this: SpeechRecognition, ev: Event) => any;
    onend: (this: SpeechRecognition, ev: Event) => any;
    onerror: (this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any;
    onnomatch: (this: SpeechRecognition, ev: SpeechRecognitionEvent) => any;
    onresult: (this: SpeechRecognition, ev: SpeechRecognitionEvent) => any;
    onsoundstart: (this: SpeechRecognition, ev: Event) => any;
    onsoundend: (this: SpeechRecognition, ev: Event) => any;
    onspeechstart: (this: SpeechRecognition, ev: Event) => any;
    onspeechend: (this: SpeechRecognition, ev: Event) => any;
    onstart: (this: SpeechRecognition, ev: Event) => any;

    abort(): void;
    start(): void;
    stop(): void;
  }

  interface SpeechRecognitionConstructor {
    new (): SpeechRecognition;
    prototype: SpeechRecognition;
  }

  interface SpeechRecognitionEvent extends Event {
    readonly results: SpeechRecognitionResultList;
    readonly resultIndex: number;
    readonly emma: Document | null;
    readonly interpretation: any;
  }

  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: SpeechRecognitionErrorCode;
    readonly message: string;
  }

  interface SpeechRecognitionResultList {
    [index: number]: SpeechRecognitionResult;
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
  }

  interface SpeechRecognitionResult {
    [index: number]: SpeechRecognitionAlternative;
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    readonly isFinal: boolean;
  }

  interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
  }

  interface SpeechGrammarList {
    [index: number]: SpeechGrammar;
    readonly length: number;
    addFromString(string: string, weight?: number): void;
    addFromURI(src: string, weight?: number): void;
    item(index: number): SpeechGrammar;
  }

  interface SpeechGrammar {
    src: string;
    weight: number;
  }

  type SpeechRecognitionErrorCode =
    | "no-speech"
    | "aborted"
    | "audio-capture"
    | "network"
    | "not-allowed"
    | "service-not-allowed"
    | "bad-grammar"
    | "language-not-supported";
}

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { SubmissionDialog } from "@/components/SubmissionDialog"; // Импортируем новый компонент

import { ChevronsUpDown, Check, Mic, StopCircle } from "lucide-react"; // Добавляем иконки
// import Link from "next/link"; // Для ссылки на админку
import { REASON_OPTIONS } from "@/lib/constants"; // Импортируем константы
import { useQuery } from "@tanstack/react-query"; // Импортируем useQuery
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"; // Импортируем QueryClient и QueryClientProvider
import { PassRequestFormSkeleton } from "@/components/PassRequestFormSkeleton"; // Импортируем компонент скелетона
import { useIsMobile } from "@/hooks/use-mobile"; // Импортируем хук для определения мобильного устройства

const queryClient = new QueryClient(); // Создаем экземпляр QueryClient

interface Student {
  value: string;
  label: string;
  group: string;
}

interface Group {
  value: string;
  label: string;
  direction: string;
}

interface Direction {
  value: string;
  label: string;
}

function PassRequestFormContent() {
  const [direction, setDirection] = React.useState("");
  const [group, setGroup] = React.useState("");
  const [studentFio, setStudentFio] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [customReason, setCustomReason] = React.useState(""); // Для "Другое"
  const [openFioSelect, setOpenFioSelect] = React.useState(false);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [dialogMessage, setDialogMessage] = React.useState<React.ReactNode>(""); // Изменяем тип на React.ReactNode
  const [dialogTitle, setDialogTitle] = React.useState("");
  const [dialogType, setDialogType] = React.useState<"success" | "error">(
    "success"
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false); // Новое состояние для отслеживания отправки
  const [isListening, setIsListening] = React.useState(false); // Состояние для голосового ввода
  const [interimTranscript, setInterimTranscript] = React.useState(""); // Состояние для промежуточного текста
  const recognitionRef = React.useRef<SpeechRecognition | null>(null); // Ссылка на объект SpeechRecognition
  const isMobile = useIsMobile(); // Определяем, является ли устройство мобильным

  const { data, isLoading, error } = useQuery({
    queryKey: ["studentsData"],
    queryFn: async () => {
      const response = await fetch("/api/students");
      if (!response.ok) {
        throw new Error("Failed to fetch students data");
      }
      return response.json();
    },
  });

  const allStudents: Student[] = React.useMemo(() => {
    return (data?.students || []).sort((a: Student, b: Student) => a.label.localeCompare(b.label));
  }, [data?.students]);

  const allDirections: Direction[] = React.useMemo(() => {
    return (data?.directions || []).sort((a: Direction, b: Direction) => a.label.localeCompare(b.label));
  }, [data?.directions]);

  const allGroups: Group[] = React.useMemo(() => {
    return (data?.groups || []).sort((a: Group, b: Group) => a.label.localeCompare(b.label));
  }, [data?.groups]);

  // Фильтрация групп по выбранному направлению
  const filteredGroups = React.useMemo(() => {
    if (!direction) return [];
    return allGroups.filter((grp) => grp.direction === direction).sort((a, b) => a.label.localeCompare(b.label));
  }, [direction, allGroups]);

  // Фильтрация студентов по выбранной группе
  const filteredStudents = React.useMemo(() => {
    if (!group) return [];
    return allStudents.filter((student) => student.group === group).sort((a, b) => a.label.localeCompare(b.label));
  }, [group, allStudents]);

  React.useEffect(() => {
    // Сброс группы и студента при изменении направления
    setGroup("");
    setStudentFio("");
  }, [direction]);

  React.useEffect(() => {
    // Сброс студента при изменении группы
    setStudentFio("");
  }, [group]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true); // Начинаем отправку

    const finalReason = reason === "Другое" ? customReason : reason;
    const selectedStudentLabel =
      filteredStudents.find((s) => s.value === studentFio)?.label || studentFio;

    try {
      const response = await fetch("/api/submit-pass-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          direction,
          group,
          studentFio: selectedStudentLabel, // Отправляем label, а не value
          reason: finalReason,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setDialogTitle("Заявка успешно отправлена!");
        setDialogMessage(
          <>
            <span className="font-bold text-blue-700">{selectedStudentLabel} </span>
             оформил(а) заявку по причине:
            <span className="font-bold"> {finalReason}</span>.
          </>
        );
        setDialogType("success");
      } else {
        setDialogTitle("Ошибка отправки заявки");
        setDialogMessage(
          <>
            Произошла ошибка при отправке заявки: <span className="font-bold">{data.message}</span>. Пожалуйста, попробуйте еще раз.
          </>
        );
        setDialogType("error");
      }
    } catch (error) {
      console.error("Ошибка при отправке заявки:", error);
      setDialogTitle("Ошибка отправки заявки");
      setDialogMessage(
        <>
          Произошла непредвиденная ошибка при отправке заявки. Пожалуйста, попробуйте еще раз.
        </>
      );
      setDialogType("error");
    } finally {
      setIsDialogOpen(true);
      setIsSubmitting(false); // Завершаем отправку
    }

    // Очистка формы
    setDirection("");
    setGroup("");
    setStudentFio("");
    setReason("");
    setCustomReason("");
  };

  // Логика голосового ввода
  const startListening = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Ваш браузер не поддерживает голосовой ввод.");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true; // Включаем непрерывное распознавание для промежуточных результатов
      recognitionRef.current.interimResults = true; // Включаем промежуточные результаты
      recognitionRef.current.lang = "ru-RU";

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setInterimTranscript(""); // Очищаем промежуточный текст при старте
        console.log("Голосовой ввод начат.");
      };

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setInterimTranscript(interim);
        if (final) {
          setCustomReason((prev) => (prev ? prev + " " : "") + final);
        }
        console.log("Промежуточный текст:", interim);
        console.log("Распознанный текст (финальный):", final);
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Ошибка голосового ввода:", event.error);
        setIsListening(false);
        setInterimTranscript(""); // Очищаем промежуточный текст при ошибке
        alert(`Ошибка голосового ввода: ${event.error}`);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        setInterimTranscript(""); // Очищаем промежуточный текст при завершении
        console.log("Голосовой ввод завершен.");
      };
    }
    
    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      // Не очищаем interimTranscript здесь, чтобы последний распознанный текст остался видимым
      // Он будет очищен при следующем старте или при отправке формы
    }
  };

  if (isLoading) return <PassRequestFormSkeleton />;
  if (error) return <div>Ошибка загрузки данных: {error.message}</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {/* <Logo className=" text-gray-800 dark:text-gray-200" /> */}
      <Logo className="mx-auto h-auto w-48 text-primary mb-6" />
      <Card className="w-full max-w-sm">
        <CardHeader className="relative">
          <CardTitle className="text-center text-2xl font-bold">
            Заявка на Пропуск
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="font-semibold" htmlFor="direction">
                Выберите Направление
              </Label>
              <Select onValueChange={setDirection} value={direction}>
                <SelectTrigger id="direction" className="w-full focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-primary">
                  <SelectValue placeholder="Выберите направление" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {allDirections.map((dir) => (
                    <SelectItem key={dir.value} value={dir.value}>
                      <div className="h-6 w-6 rounded-full flex items-center justify-center text-sm font-semibold">
                        {dir.label.charAt(0)}
                      </div>
                      {dir.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold" htmlFor="group">
                Выберите Группу
              </Label>
              <Select
                onValueChange={setGroup}
                value={group}
                disabled={!direction || filteredGroups.length === 0}
              >
                <SelectTrigger id="group" className="w-full focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-primary">
                  <SelectValue placeholder="Выберите группу" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {filteredGroups.map((grp) => (
                    <SelectItem key={grp.value} value={grp.value}>
                      {grp.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold" htmlFor="student-fio-input">
                Ваше ФИО
              </Label>
              <Popover open={openFioSelect} onOpenChange={setOpenFioSelect}>
                <PopoverTrigger asChild className="focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-primary">
                  <Button
                    id="student-fio-input"
                    variant="outline"
                    role="combobox"
                    aria-expanded={openFioSelect}
                    className="w-full justify-between"
                    disabled={!group || filteredStudents.length === 0}
                  >
                    {studentFio
                      ? filteredStudents.find((student) => student.value === studentFio)
                          ?.label
                      : "Начните вводить ФИО..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 max-h-60 overflow-y-auto">
                  <Command>
                    <CommandInput id="student-search-input" name="student-search" placeholder="Найти студента..." />
                    <CommandEmpty>Студент не найден.</CommandEmpty>
                    <CommandGroup>
                      {filteredStudents.map((student) => (
                        <CommandItem
                          key={student.value}
                          value={student.label}
                          onSelect={(currentLabel) => {
                            const selected = filteredStudents.find(
                              (s) => s.label === currentLabel
                            );
                            if (selected) {
                              setStudentFio(
                                selected.value === studentFio
                                  ? ""
                                  : selected.value
                              );
                            }
                            setOpenFioSelect(false);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              studentFio === student.value
                                ? "opacity-100"
                                : "opacity-0"
                            }`}
                          />
                          {student.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold" htmlFor="reason">
                Причина
              </Label>
              <Select onValueChange={setReason} value={reason}>
                <SelectTrigger id="reason" className="w-full focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-primary">
                  <SelectValue placeholder="Выберите причину" />
                </SelectTrigger>
                <SelectContent>
                  {REASON_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {reason === "Другое" && (
                <div className="relative mt-2">
                  <Textarea
                    id="custom-reason"
                    placeholder="Опишите причину получения пропуска..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    rows={3}
                    required
                    className="pr-10 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-primary"
                  />
                  {isMobile && ( // Отображаем кнопку только на мобильных устройствах
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2 h-8 w-8"
                      onClick={isListening ? stopListening : startListening}
                      disabled={isSubmitting}
                    >
                      {isListening ? (
                        <StopCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <Mic className="h-5 w-5" />
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>

            {isListening && isMobile && (
              <div className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-foreground/90 backdrop-blur-xs z-50 min-h-full min-w-full">
                <div className="flex flex-col items-center p-4 rounded-lg">
                  <Mic className="h-24 w-24 text-white animate-pulse-mic" />
                  <p className="mt-4 text-white text-lg text-center">
                    {interimTranscript || "Слушаю..."}
                  </p>
                  <Button
                    type="button"
                    variant="destructive"
                    className="mt-4"
                    onClick={stopListening}
                  >
                    <StopCircle className="h-5 w-5 mr-2" />
                    Закончить запись
                  </Button>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Отправка...
                </>
              ) : (
                "Отправить Заявку"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <SubmissionDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={dialogTitle}
        message={dialogMessage}
        type={dialogType}
      />
    </div>
  );
}

export function PassRequestForm() {
  return (
    <QueryClientProvider client={queryClient}>
      <PassRequestFormContent />
    </QueryClientProvider>
  );
}
