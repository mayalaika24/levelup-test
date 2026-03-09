"use client";

import { Languages } from "lucide-react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export function LanguageToggle() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const toggleLanguage = () => {
        const nextLocale = locale === "en" ? "ar" : "en";
        router.replace(pathname, { locale: nextLocale });
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="flex h-9 items-center gap-2 rounded-md px-3 font-medium transition-colors hover:bg-accent/50"
        >
            <Languages className="h-4 w-4 text-primary" />
            <span className="text-sm">
                {locale === "en" ? "العربية" : "English"}
            </span>
        </Button>
    );
}
