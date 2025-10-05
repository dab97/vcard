"use client";

import { Button } from "@/components/ui/button";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Menu, BarChart, Users, Book, Sunset, Trees, Zap } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import React from "react";
import { LucideIcon } from "lucide-react";

interface SubNavItem {
  title: string;
  description: string;
  icon: LucideIcon;
  url: string;
}

interface NavItem {
  title: string;
  href?: string;
  description?: string;
  icon?: LucideIcon;
  matcher?: string;
  items?: SubNavItem[];
}

const navItems: NavItem[] = [
  {
    title: "Студенты",
    href: "/admin/students",
    description: "Управление студентами и их данными",
    icon: Users,
    matcher: "/admin/students",
  },
  {
    title: "Отчеты",
    href: "/admin/reports",
    description: "Просмотр отчетов и статистики",
    icon: BarChart,
    matcher: "/admin/reports",
  },
  // {
  //   title: "Дополнительно",
  //   href: "#",
  //   items: [
  //     {
  //       title: "Компания",
  //       description: "Наша миссия и ценности",
  //       icon: Trees,
  //       url: "/company",
  //     },
  //     {
  //       title: "Поддержка",
  //       description: "Свяжитесь с нашей службой поддержки",
  //       icon: Zap,
  //       url: "/support",
  //     },
  //   ],
  // },
];

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";

function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();

  return (
    <NavigationMenu>
      <NavigationMenuList>
        {navItems.map((item) => (
          <NavigationMenuItem key={item.title}>
            {item.items ? (
              <>
                <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                    {item.items.map((subItem) => (
                      <ListItem
                        key={subItem.title}
                        title={subItem.title}
                        href={subItem.url}
                      >
                        {subItem.description}
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </>
            ) : (
              <NavigationMenuLink
                href={item.href}
                className={cn(
                  navigationMenuTriggerStyle(),
                  pathname === item.matcher ? "text-black" : "text-muted-foreground"
                )}
              >
                {item.title}
              </NavigationMenuLink>
            )}
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

export default function AdminHeader() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClientComponentClient();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/admin/login");
      }
      setUser(user);
    };
    fetchUser();
  }, [supabase, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  const pageTitles = {
    "/admin/students": "Студенты",
    "/admin/reports": "Отчеты и Статистика",
  };

  const getTitle = () => {
    for (const [path, title] of Object.entries(pageTitles)) {
      if (pathname.startsWith(path)) {
        return title;
      }
    }
    return "Панель Администрирования";
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border bg-card px-2 md:px-4 rounded-xl backdrop-blur-sm">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 lg:gap-6">
        <Link
          href="/admin/students"
          className="flex items-center gap-2 text-lg font-semibold md:text-base">
          <span className="font-bold text-xl">RGSU</span>
        </Link>
        <MainNav />
      </nav>
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Открыть меню навигации</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <nav className="grid gap-2 text-lg font-medium p-4">
            <Link
              href="/admin/students"
              className="flex items-center gap-2 text-lg font-semibold mb-4">
              <span className="font-bold text-xl">RGSU</span>
            </Link>
            {navItems.map((item) => (
              <React.Fragment key={item.title}>
                {item.items ? (
                  <>
                    <h3 className="text-sm font-semibold mt-4 mb-2">{item.title}</h3>
                    {item.items.map((subItem: SubNavItem) => (
                      <SheetClose asChild key={subItem.url}>
                        <Link
                          href={subItem.url}
                          className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground">
                          <subItem.icon className="h-5 w-5" />
                          {subItem.title}
                        </Link>
                      </SheetClose>
                    ))}
                  </>
                ) : (
                  <SheetClose asChild key={item.href}>
                    <Link
                      href={item.href!}
                      className={cn(
                        "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground",
                        { "bg-muted text-foreground": pathname === item.matcher }
                      )}>
                      {item.icon && <item.icon className="h-5 w-5" />}
                      {item.title}
                    </Link>
                  </SheetClose>
                )}
              </React.Fragment>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex-1 sm:flex-initial">
          <h1 className="text-sm md:text-xl font-semibold text-gray-800 dark:text-gray-200">{getTitle()}</h1>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          {user && (
            <>
              <span className="hidden sm:inline text-gray-700 dark:text-gray-300 text-xs md:text-sm">
                {user.email}
              </span>
              <Button onClick={handleLogout} variant="ghost" className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                Выйти
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
