"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const locale = useLocale();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");

    if (isLoggedIn !== "true") {
      router.replace(`/${locale}/login`);
      return;
    }

    setDisplayName(localStorage.getItem("userDisplayName") ?? "User");
  }, [locale, router]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4">
      <section className="w-full rounded-2xl border border-border bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Welcome back, {displayName}.</p>
      </section>
    </main>
  );
}