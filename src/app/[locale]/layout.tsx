import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Montserrat, Tajawal } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
});

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "LevelUp Academy",
  description: "LevelUp Academy learning platform",
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: "en" | "ar" }>;
}>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages({ locale });
  const direction = locale === "ar" ? "rtl" : "ltr";
  const localeFontClass = locale === "ar" ? tajawal.className : montserrat.className;
  const cookieStore = await cookies();
  const cookieTheme = cookieStore.get("theme")?.value;
  const theme = cookieTheme === "dark" ? "dark" : "light";

  return (
    <html
      lang={locale}
      dir={direction}
      className={theme === "dark" ? "dark" : undefined}
      style={{ colorScheme: theme }}
      suppressHydrationWarning
    >
      <body
        suppressHydrationWarning
        className={`${localeFontClass} antialiased`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
