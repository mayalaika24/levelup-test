"use client";

import { useTranslations } from "next-intl";
import {
  X,
  Building2,
  Calendar,
  Clock,
  GraduationCap,
  BookOpen,
  Users,
  Library,
  Home,
  CalendarClock,
  Settings,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const sidebarItems = [
  {
    title: "settings",
    icon: Settings,
    href: "/dashboard/settings",
    badge: "settings",
  },
  {
    title: "academicYear",
    icon: Calendar,
    href: "/dashboard/academic-year",
    badge: "configuration",
  },
  {
    title: "semesters",
    icon: Clock,
    href: "/dashboard/semesters",
    badge: "configuration",
  },
  {
    title: "educationalStages",
    icon: GraduationCap,
    href: "/dashboard/stages",
    badge: "configuration",
  },
  {
    title: "grades",
    icon: BookOpen,
    href: "/dashboard/grades",
    badge: "configuration",
  },
  {
    title: "sections",
    icon: Users,
    href: "/dashboard/sections",
    badge: "configuration",
  },
  {
    title: "subjects",
    icon: Library,
    href: "/dashboard/subjects",
    badge: "configuration",
  },
  {
    title: "classrooms",
    icon: Home,
    href: "/dashboard/classrooms",
    badge: "configuration",
  },
  {
    title: "timetableSettings",
    icon: CalendarClock,
    href: "/dashboard/timetable-settings",
    badge: "settings",
  },
];

export function DashboardSidebar({ isOpen, onClose }: DashboardSidebarProps) {
  const st = useTranslations("SchoolStructure");
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />

      {/* Sidebar Content */}
      <aside
        className={cn(
          "fixed inset-y-0 z-50 flex w-72 flex-col bg-card/95 backdrop-blur-md transition-transform duration-300 md:sticky md:top-0 md:z-0 md:flex md:h-screen md:w-[280px] md:translate-x-0",
          "ltr:left-0 rtl:right-0",
          "border-border ltr:border-r rtl:border-l",
          isOpen ? "translate-x-0" : "max-md:ltr:-translate-x-full max-md:rtl:translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-border/40 px-4 md:px-6 h-[110px]">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </div>
            <p className="font-bold text-foreground text-lg tracking-tight">{st("title")}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-border">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.includes(item.href);

            return (
              <Link
                key={item.title}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                <span className="flex-1">{st(item.title)}</span>
                <ChevronRight className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isActive ? "translate-x-1 rtl:-translate-x-1" : "opacity-0 group-hover:opacity-100 ltr:group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
                )} />
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
