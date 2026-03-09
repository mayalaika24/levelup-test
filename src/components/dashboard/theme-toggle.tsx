"use client";

import { Moon, Sun } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
    const [theme, setTheme] = useState<"light" | "dark">(() => {
        if (typeof window === "undefined") {
            return "light";
        }
        return document.documentElement.classList.contains("dark") ? "dark" : "light";
    });

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);

        if (newTheme === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }

        document.documentElement.style.colorScheme = newTheme;
        document.cookie = `theme=${newTheme}; path=/; max-age=31536000`;
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9 rounded-md transition-colors hover:bg-accent/50"
        >
            {theme === "light" ? (
                <Sun className="h-4 w-4 text-amber-500 transition-all" />
            ) : (
                <Moon className="h-4 w-4 text-sky-300 transition-all" />
            )}
        </Button>
    );
}
