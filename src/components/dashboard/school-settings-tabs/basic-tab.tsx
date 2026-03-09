"use client";

import { Landmark, Save, ShieldCheck, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import {
  basicSchoolSettingsSchema,
  type BasicSchoolSettingsInput,
  type PersistedSchoolSettingsInput,
} from "@/lib/validations/school-settings";

type BasicSchoolSettingsFormValues = BasicSchoolSettingsInput & {
  logo: FileList | null;
  seal: FileList | null;
};

const fieldClassName =
  "h-11 w-full rounded-xl border border-input bg-background/80 px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";
const selectTriggerClassName =
  "h-11 w-full rounded-xl border-input bg-background/80 px-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/30";

type BasicTabProps = {
  data: PersistedSchoolSettingsInput;
  isSaving: boolean;
  onSave: (payload: BasicSchoolSettingsInput & { logoFileName: string; sealFileName: string }) => Promise<void>;
};

export function SchoolSettingsBasicTab({ data, isSaving, onSave }: BasicTabProps) {
  const t = useTranslations("SchoolSettings");
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const yearOptions = useMemo(
    () => Array.from({ length: currentYear - 1949 }, (_, index) => currentYear - index),
    [currentYear],
  );

  const {
    register,
    control,
    setError,
    clearErrors,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BasicSchoolSettingsFormValues>({
    defaultValues: {
      schoolNameAr: data.schoolNameAr,
      schoolNameEn: data.schoolNameEn,
      foundedYear: data.foundedYear,
      currency: data.currency,
      allowMultiCurrency: data.allowMultiCurrency,
      commercialRegisterNumber: data.commercialRegisterNumber,
      showLogoInInvoices: data.showLogoInInvoices,
      timezone: data.timezone,
      defaultSystemLanguage: data.defaultSystemLanguage,
      notificationsEnabled: data.notificationsEnabled,
      logo: null,
      seal: null,
    },
  });

  useEffect(() => {
    reset({
      schoolNameAr: data.schoolNameAr,
      schoolNameEn: data.schoolNameEn,
      foundedYear: data.foundedYear,
      currency: data.currency,
      allowMultiCurrency: data.allowMultiCurrency,
      commercialRegisterNumber: data.commercialRegisterNumber,
      showLogoInInvoices: data.showLogoInInvoices,
      timezone: data.timezone,
      defaultSystemLanguage: data.defaultSystemLanguage,
      notificationsEnabled: data.notificationsEnabled,
      logo: null,
      seal: null,
    });
  }, [data, reset]);

  const watchedLogo = useWatch({ control, name: "logo" });
  const watchedSeal = useWatch({ control, name: "seal" });
  const logoFileName = watchedLogo?.[0]?.name ?? data.logoFileName ?? "";
  const sealFileName = watchedSeal?.[0]?.name ?? data.sealFileName ?? "";

  async function handleSave(values: BasicSchoolSettingsFormValues) {
    const parsed = basicSchoolSettingsSchema.safeParse(values);

    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        setError(issue.path.join(".") as never, { message: t("validation.invalidField") });
      });
      toast.error(t("validation.checkRequiredFields"));
      return;
    }

    const logoFile = values.logo?.[0];
    const sealFile = values.seal?.[0];

    if (logoFile && !logoFile.type.startsWith("image/")) {
      setError("logo", { message: t("validation.logoImageOnly") });
      toast.error(t("validation.checkRequiredFields"));
      return;
    }

    if (sealFile && sealFile.size > 5 * 1024 * 1024) {
      setError("seal", { message: t("validation.sealSize") });
      toast.error(t("validation.checkRequiredFields"));
      return;
    }

    await onSave({
      ...parsed.data,
      logoFileName: logoFile?.name ?? data.logoFileName ?? "",
      sealFileName: sealFile?.name ?? data.sealFileName ?? "",
    });
  }

  return (
    <section className="rounded-2xl border border-border bg-card/80 p-5 shadow-xs sm:p-6">
      <div className="mb-5 flex items-center gap-2">
        <Landmark className="size-5 text-primary" />
        <Typography as="h2" variant="h3">
          {t("basicInfo.title")}
        </Typography>
      </div>

      <form onSubmit={handleSubmit(handleSave)} className="space-y-6" noValidate>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Typography as="label" variant="label" htmlFor="schoolNameAr">
              {t("basicInfo.schoolNameAr")}
            </Typography>
            <input
              id="schoolNameAr"
              className={fieldClassName}
              {...register("schoolNameAr", { onChange: () => clearErrors("schoolNameAr") })}
            />
            {errors.schoolNameAr ? <Typography variant="error">{errors.schoolNameAr.message}</Typography> : null}
          </div>

          <div className="space-y-2">
            <Typography as="label" variant="label" htmlFor="schoolNameEn">
              {t("basicInfo.schoolNameEn")}
            </Typography>
            <input
              id="schoolNameEn"
              className={fieldClassName}
              {...register("schoolNameEn", { onChange: () => clearErrors("schoolNameEn") })}
            />
            {errors.schoolNameEn ? <Typography variant="error">{errors.schoolNameEn.message}</Typography> : null}
          </div>

          <div className="space-y-2">
            <Typography as="label" variant="label" htmlFor="logo">
              {t("basicInfo.logo")}
            </Typography>
            <label
              htmlFor="logo"
              className="flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-input px-3 text-sm text-muted-foreground transition hover:border-primary/60 hover:text-foreground"
            >
              <Upload className="size-4" />
              <span className="truncate">{logoFileName || t("uploadHint.image")}</span>
            </label>
            <input
              id="logo"
              type="file"
              accept="image/*"
              className="hidden"
              {...register("logo", {
                onChange: () => {
                  clearErrors("logo");
                },
              })}
            />
            {errors.logo ? <Typography variant="error">{errors.logo.message}</Typography> : null}
          </div>

          <div className="space-y-2">
            <Typography as="label" variant="label" htmlFor="foundedYear">
              {t("basicInfo.foundedYear")}
            </Typography>
            <Controller
              name="foundedYear"
              control={control}
              render={({ field }) => (
                <Select value={String(field.value)} onValueChange={(value) => field.onChange(Number(value))}>
                  <SelectTrigger id="foundedYear" className={selectTriggerClassName}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Typography as="label" variant="label" htmlFor="currency">
              {t("basicInfo.currency")}
            </Typography>
            <Controller
              name="currency"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="currency" className={selectTriggerClassName}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="SAR">SAR - Saudi Riyal</SelectItem>
                    <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="EGP">EGP - Egyptian Pound</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Typography as="label" variant="label" htmlFor="commercialRegisterNumber">
              {t("basicInfo.commercialRegisterNumber")}
            </Typography>
            <input
              id="commercialRegisterNumber"
              className={fieldClassName}
              {...register("commercialRegisterNumber", {
                onChange: () => clearErrors("commercialRegisterNumber"),
              })}
            />
            {errors.commercialRegisterNumber ? (
              <Typography variant="error">{errors.commercialRegisterNumber.message}</Typography>
            ) : null}
          </div>

          <div className="space-y-2">
            <Typography as="label" variant="label" htmlFor="timezone">
              {t("basicInfo.timezone")}
            </Typography>
            <Controller
              name="timezone"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="timezone" className={selectTriggerClassName}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Riyadh">Asia/Riyadh (GMT+3)</SelectItem>
                    <SelectItem value="Asia/Dubai">Asia/Dubai (GMT+4)</SelectItem>
                    <SelectItem value="Africa/Cairo">Africa/Cairo (GMT+2)</SelectItem>
                    <SelectItem value="Europe/London">Europe/London (GMT+0)</SelectItem>
                    <SelectItem value="America/New_York">America/New_York (GMT-5)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Typography as="label" variant="label" htmlFor="defaultSystemLanguage">
              {t("basicInfo.defaultSystemLanguage")}
            </Typography>
            <Controller
              name="defaultSystemLanguage"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="defaultSystemLanguage" className={selectTriggerClassName}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ar">{t("languages.ar")}</SelectItem>
                    <SelectItem value="en">{t("languages.en")}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Typography as="label" variant="label" htmlFor="seal">
              {t("basicInfo.seal")}
            </Typography>
            <label
              htmlFor="seal"
              className="flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-input px-3 text-sm text-muted-foreground transition hover:border-primary/60 hover:text-foreground"
            >
              <ShieldCheck className="size-4" />
              <span className="truncate">{sealFileName || t("uploadHint.file")}</span>
            </label>
            <input
              id="seal"
              type="file"
              className="hidden"
              {...register("seal", {
                onChange: () => {
                  clearErrors("seal");
                },
              })}
            />
            {errors.seal ? <Typography variant="error">{errors.seal.message}</Typography> : null}
          </div>

          <label className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-foreground">
            <input type="checkbox" className="size-4 accent-primary" {...register("allowMultiCurrency")} />
            {t("basicInfo.allowMultiCurrency")}
          </label>

          <label className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-foreground">
            <input type="checkbox" className="size-4 accent-primary" {...register("showLogoInInvoices")} />
            {t("basicInfo.showLogoInInvoices")}
          </label>

          <label className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-foreground md:col-span-2">
            <input type="checkbox" className="size-4 accent-primary" {...register("notificationsEnabled")} />
            {t("basicInfo.notificationsEnabled")}
          </label>
        </div>

        <div className="flex items-center justify-end">
          <Button type="submit" size="lg" className="h-11 rounded-xl px-5" disabled={isSaving || isSubmitting}>
            <Save className="size-4" />
            {isSaving || isSubmitting ? t("saving") : t("save")}
          </Button>
        </div>
      </form>
    </section>
  );
}
