"use client";

import { Globe, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import {
  socialSchoolSettingsSchema,
  type PersistedSchoolSettingsInput,
  type SocialSchoolSettingsInput,
} from "@/lib/validations/school-settings";

const fieldClassName =
  "h-11 w-full rounded-xl border border-input bg-background/80 px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";

type SocialTabProps = {
  data: PersistedSchoolSettingsInput;
  isSaving: boolean;
  onSave: (payload: SocialSchoolSettingsInput) => Promise<void>;
};

export function SchoolSettingsSocialTab({ data, isSaving, onSave }: SocialTabProps) {
  const t = useTranslations("SchoolSettings");
  const {
    register,
    setError,
    clearErrors,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SocialSchoolSettingsInput>({
    defaultValues: data.socialMedia,
  });

  useEffect(() => {
    reset(data.socialMedia);
  }, [data, reset]);

  async function handleSave(values: SocialSchoolSettingsInput) {
    const parsed = socialSchoolSettingsSchema.safeParse(values);

    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        setError(issue.path.join(".") as never, { message: t("validation.invalidField") });
      });
      toast.error(t("validation.checkRequiredFields"));
      return;
    }

    await onSave(parsed.data);
  }

  return (
    <section className="rounded-2xl border border-border bg-card/80 p-5 shadow-xs sm:p-6">
      <div className="mb-5 flex items-center gap-2">
        <Globe className="size-5 text-primary" />
        <Typography as="h2" variant="h3">
          {t("socialMedia.title")}
        </Typography>
      </div>

      <form onSubmit={handleSubmit(handleSave)} className="space-y-6" noValidate>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Typography as="label" variant="label" htmlFor="facebook">
              {t("socialMedia.facebook")}
            </Typography>
            <input
              id="facebook"
              className={fieldClassName}
              placeholder="https://facebook.com/your-school"
              {...register("facebook", { onChange: () => clearErrors("facebook") })}
            />
            {errors.facebook ? <Typography variant="error">{errors.facebook.message}</Typography> : null}
          </div>

          <div className="space-y-2">
            <Typography as="label" variant="label" htmlFor="instagram">
              {t("socialMedia.instagram")}
            </Typography>
            <input
              id="instagram"
              className={fieldClassName}
              placeholder="https://instagram.com/your-school"
              {...register("instagram", { onChange: () => clearErrors("instagram") })}
            />
            {errors.instagram ? <Typography variant="error">{errors.instagram.message}</Typography> : null}
          </div>

          <div className="space-y-2">
            <Typography as="label" variant="label" htmlFor="x">
              {t("socialMedia.x")}
            </Typography>
            <input
              id="x"
              className={fieldClassName}
              placeholder="https://x.com/your-school"
              {...register("x", { onChange: () => clearErrors("x") })}
            />
            {errors.x ? <Typography variant="error">{errors.x.message}</Typography> : null}
          </div>

          <div className="space-y-2">
            <Typography as="label" variant="label" htmlFor="linkedIn">
              {t("socialMedia.linkedIn")}
            </Typography>
            <input
              id="linkedIn"
              className={fieldClassName}
              placeholder="https://linkedin.com/school/your-school"
              {...register("linkedIn", { onChange: () => clearErrors("linkedIn") })}
            />
            {errors.linkedIn ? <Typography variant="error">{errors.linkedIn.message}</Typography> : null}
          </div>
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
