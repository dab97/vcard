"use client";

import AdminHeader from "@/components/AdminHeader";
import { usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  return (
    <div className="flex min-h-screen w-full flex-col bg-gray-100 dark:bg-gray-900">
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-8 pt-2 md:pt-4">
        {!isLoginPage && <AdminHeader />}
        <main className="flex flex-1 flex-col gap-4">
          {children}
        </main>
      </div>
    </div>
  );
}
