"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { loginUser } from "@/lib/services/auth";
import { type LoginInput, loginSchema } from "@/lib/validations/auth";

export default function LoginPage() {
  const t = useTranslations("LoginPage");
  const locale = useLocale();
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginInput) {
    const normalizedValues = {
      username: values.username.trim(),
      password: values.password,
    };

    const result = loginSchema.safeParse(normalizedValues);

    if (!result.success) {
      setFormMessage("");
      return;
    }

    setIsSubmitting(true);
    const loginResponse = await loginUser(result.data);
    setIsSubmitting(false);

    if (!loginResponse.success) {
      setFormMessage(t("invalidCredentials"));
      return;
    }

    setFormMessage(t("successMessage"));
    router.push(`/${locale}/dashboard`);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-linear-to-br from-background via-secondary/30 to-background px-4 py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-20 top-24 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute bottom-10 left-1/2 h-52 w-52 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
      </div>

      <section className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-border/70 bg-card/85 shadow-[0_20px_60px_-25px_rgba(0,0,0,0.35)] backdrop-blur-sm lg:grid-cols-2">
          <aside className="hidden flex-col justify-between bg-linear-to-b from-primary/95 to-primary p-10 text-primary-foreground lg:flex">
            <div className="space-y-4">
              <Image src="/school-logo.svg" alt="School logo" width={68} height={68} />
              <Typography variant="body" className="max-w-sm text-primary-foreground/90">
                {t("brandDescription")}
              </Typography>
            </div>
            <div className="space-y-3">
              <Typography as="h2" variant="h2">
                LevelUp Academy
              </Typography>
              <Typography variant="muted" className="text-primary-foreground/80">
                {t("brandMotto")}
              </Typography>
            </div>
          </aside>

          <div className="p-6 sm:p-10">
            <div className={`mx-auto w-full max-w-md space-y-7`}>
              <div className="flex items-center gap-3 lg:hidden">
                <Image src="/school-logo.svg" alt="School logo" width={48} height={48} />
                <div>
                  <Typography variant="muted">LevelUp Academy</Typography>
                  <Typography variant="caption" className="text-muted-foreground/80">
                    {t("helperText")}
                  </Typography>
                </div>
              </div>

              <header className="space-y-2">
                <Typography as="h1" variant="h1" className="tracking-tight">
                  {t("title")}
                </Typography>
                <Typography variant="muted">{t("subtitle")}</Typography>
              </header>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                <div className="space-y-2">
                  <Typography as="label" variant="label" htmlFor="username">
                    {t("usernameLabel")}
                  </Typography>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 inline-flex items-center text-muted-foreground">
                      <User className="size-4" />
                    </span>
                    <input
                      id="username"
                      autoComplete="username"
                      placeholder={t("usernamePlaceholder")}
                      aria-invalid={Boolean(errors.username)}
                      {...register("username", {
                        onChange: () => setFormMessage(""),
                        validate: (value) => {
                          if (!value.trim()) {
                            return t("validation.usernameRequired");
                          }

                          return loginSchema.shape.username.safeParse(value).success
                            ? true
                            : t("validation.usernameInvalid");
                        },
                      })}
                      className="h-11 w-full rounded-xl border border-input bg-background/80 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  {errors.username ? (
                    <Typography variant="error">{errors.username.message}</Typography>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Typography as="label" variant="label" htmlFor="password">
                    {t("passwordLabel")}
                  </Typography>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 inline-flex items-center text-muted-foreground">
                      <Lock className="size-4" />
                    </span>
                    <input
                      id="password"
                      autoComplete="current-password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t("passwordPlaceholder")}
                      aria-invalid={Boolean(errors.password)}
                      {...register("password", {
                        onChange: () => setFormMessage(""),
                        validate: (value) => {
                          if (!value) {
                            return t("validation.passwordRequired");
                          }

                          return loginSchema.shape.password.safeParse(value).success
                            ? true
                            : t("validation.passwordInvalid");
                        },
                      })}
                      className="h-11 w-full rounded-xl border border-input bg-background/80 px-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-3 inline-flex items-center text-muted-foreground transition hover:text-foreground"
                      onClick={() => setShowPassword((previous) => !previous)}
                      aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {errors.password ? (
                    <Typography variant="error">{errors.password.message}</Typography>
                  ) : null}
                </div>

                <div className="flex items-center justify-between gap-3 text-sm">
                  <Typography variant="muted">{t("helperText")}</Typography>
                  <Link
                    href="#"
                    className="font-medium text-primary transition hover:text-primary/80 hover:underline"
                  >
                    {t("forgotPassword")}
                  </Link>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="h-11 w-full rounded-xl text-sm font-semibold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t("submitting") : t("submit")}
                </Button>

                {formMessage ? (
                  <Typography
                    variant="success"
                    className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2"
                  >
                    {formMessage}
                  </Typography>
                ) : null}
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
