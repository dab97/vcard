import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-theme(spacing.16))] flex-col items-center justify-center gap-4 py-10">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">404</h1>
      <p className="text-sm md:text-lg text-muted-foreground text-center">
        Извините, мы не смогли найти страницу, которую вы ищете.
      </p>
      <Button asChild>
        <Link href="/">Вернуться на главную</Link>
      </Button>
    </div>
  );
}
