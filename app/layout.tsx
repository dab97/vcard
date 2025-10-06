import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"; // Импортируем Toaster

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Форма заявки на временный пропуск",
  description: "Сервис для быстрой подачи заявки на оформление временного пропуска. Заполните онлайн-форму и получите доступ в здание максимально просто.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-100 dark:bg-gray-900`}>
        {children}
        <Toaster position="top-center" /> {/* Устанавливаем позицию по центру сверху */}
      </body>
    </html>
  );
}
