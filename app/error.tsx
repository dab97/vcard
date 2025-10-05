"use client";

import { useEffect } from "react";
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
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">500</h1>
      <p className="text-sm md:text-lg text-muted-foreground text-center">
        Что-то пошло не так.
      </p>
      <Button onClick={() => reset()}>Попробовать снова</Button>
    </div>
  );
}
