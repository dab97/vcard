"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-theme(spacing.16))] flex-col items-center justify-center gap-4 py-10">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        {error.message.includes("Failed to fetch students data")
          ? "Ошибка загрузки данных"
          : "500"}
      </h1>
      <p className="text-sm md:text-lg text-muted-foreground text-center">
        {error.message.includes("Failed to fetch students data")
          ? "Не удалось получить данные о студентах. Пожалуйста, попробуйте еще раз."
          : "Что-то пошло не так."}
      </p>
      {error.message.includes("Failed to fetch students data") ? (
        <Button onClick={() => reset()}>Попробовать снова</Button>
      ) : (
        <Button asChild>
          <Link href="/">Вернуться на главную</Link>
        </Button>
      )}
    </div>
  );
}
