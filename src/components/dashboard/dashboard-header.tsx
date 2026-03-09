"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { ThemeToggle } from "./theme-toggle";
import { LanguageToggle } from "./language-toggle";

interface DashboardHeaderProps {
  onMenuClick: () => void;
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const t = useTranslations("DashboardLayout");
  const locale = useLocale();
  const router = useRouter();

  const displayName = useSyncExternalStore(
    () => () => undefined,
    () => localStorage.getItem("userDisplayName") ?? "",
    () => "",
  );
  const [currentDateTime, setCurrentDateTime] = useState(() => new Date());

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1_000);

    return () => window.clearInterval(timerId);
  }, []);

  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(currentDateTime),
    [currentDateTime, locale],
  );

  const formattedTime = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(currentDateTime),
    [currentDateTime, locale],
  );

  const greetingKey = currentDateTime.getHours() < 12 ? "goodMorning" : "goodEvening";

  function handleLogout() {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userDisplayName");
    document.cookie = "auth_session=; path=/; max-age=0";
    router.replace(`/${locale}/login`);
  }

  return (
    <header className="flex items-center gap-4 border-b border-border bg-card/60 px-4 backdrop-blur sm:px-6 h-[110px]">
      <button
        onClick={onMenuClick}
        className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground md:hidden"
      >
        <Menu className="h-6 w-6" />
      </button>
      <div className="flex-1">
        <Typography variant="h2" as="h1">
          {t(greetingKey)} {displayName || t("defaultUser")}
        </Typography>
        <Typography variant="muted" className="mt-1">
          {formattedDate} - {formattedTime}
        </Typography>
      </div>

      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="size-4" />
          {t("logout")}
        </Button>
        <LanguageToggle />
        <div className="h-4 w-px bg-border/50 mx-1 hidden sm:block" />
        <ThemeToggle />
      </div>
    </header>
  );
}
