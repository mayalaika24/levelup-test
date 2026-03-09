"use client";

import { Building2, Globe, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import {
  contactAndSocialSchoolSettingsSchema,
  type ContactAndSocialSchoolSettingsInput,
  type PersistedSchoolSettingsInput,
} from "@/lib/validations/school-settings";

const fieldClassName =
  "h-11 w-full rounded-xl border border-input bg-background/80 px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";

const textAreaClassName =
  "w-full rounded-xl border border-input bg-background/80 px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";

type ContactSocialTabProps = {
  data: PersistedSchoolSettingsInput;
  isSaving: boolean;
  onSave: (payload: ContactAndSocialSchoolSettingsInput) => Promise<void>;
};

export function SchoolSettingsContactSocialTab({ data, isSaving, onSave }: ContactSocialTabProps) {
  const t = useTranslations("SchoolSettings");
  const {
    register,
    setError,
    clearErrors,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactAndSocialSchoolSettingsInput>({
    defaultValues: {
      country: data.country,
      city: data.city,
      detailedAddress: data.detailedAddress,
      primaryPhone: data.primaryPhone,
      primaryEmail: data.primaryEmail,
      website: data.website,
      socialMedia: data.socialMedia,
    },
  });

  useEffect(() => {
    reset({
      country: data.country,
      city: data.city,
      detailedAddress: data.detailedAddress,
      primaryPhone: data.primaryPhone,
      primaryEmail: data.primaryEmail,
      website: data.website,
      socialMedia: data.socialMedia,
    });
  }, [data, reset]);

  async function handleSave(values: ContactAndSocialSchoolSettingsInput) {
    const parsed = contactAndSocialSchoolSettingsSchema.safeParse(values);

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
        <Building2 className="size-5 text-primary" />
        <Typography as="h2" variant="h3">
          {t("contactInfo.title")} - {t("socialMedia.title")}
        </Typography>
      </div>

      <form onSubmit={handleSubmit(handleSave)} className="space-y-6" noValidate>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-primary" />
            <Typography as="h3" variant="h4">
              {t("contactInfo.title")}
            </Typography>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Typography as="label" variant="label" htmlFor="country">
                {t("contactInfo.country")}
              </Typography>
              <input
                id="country"
                className={fieldClassName}
                {...register("country", { onChange: () => clearErrors("country") })}
              />
              {errors.country ? <Typography variant="error">{errors.country.message}</Typography> : null}
            </div>

            <div className="space-y-2">
              <Typography as="label" variant="label" htmlFor="city">
                {t("contactInfo.city")}
              </Typography>
              <input id="city" className={fieldClassName} {...register("city", { onChange: () => clearErrors("city") })} />
              {errors.city ? <Typography variant="error">{errors.city.message}</Typography> : null}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Typography as="label" variant="label" htmlFor="detailedAddress">
                {t("contactInfo.detailedAddress")}
              </Typography>
              <textarea
                id="detailedAddress"
                rows={3}
                className={textAreaClassName}
                {...register("detailedAddress", { onChange: () => clearErrors("detailedAddress") })}
              />
              {errors.detailedAddress ? <Typography variant="error">{errors.detailedAddress.message}</Typography> : null}
            </div>

            <div className="space-y-2">
              <Typography as="label" variant="label" htmlFor="primaryPhone">
                {t("contactInfo.primaryPhone")}
              </Typography>
              <input
                id="primaryPhone"
                className={fieldClassName}
                inputMode="tel"
                {...register("primaryPhone", { onChange: () => clearErrors("primaryPhone") })}
              />
              {errors.primaryPhone ? <Typography variant="error">{errors.primaryPhone.message}</Typography> : null}
            </div>

            <div className="space-y-2">
              <Typography as="label" variant="label" htmlFor="primaryEmail">
                {t("contactInfo.primaryEmail")}
              </Typography>
              <input
                id="primaryEmail"
                type="email"
                className={fieldClassName}
                {...register("primaryEmail", { onChange: () => clearErrors("primaryEmail") })}
              />
              {errors.primaryEmail ? <Typography variant="error">{errors.primaryEmail.message}</Typography> : null}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Typography as="label" variant="label" htmlFor="website">
                {t("contactInfo.website")}
              </Typography>
              <input
                id="website"
                type="url"
                className={fieldClassName}
                placeholder="https://example.com"
                {...register("website", { onChange: () => clearErrors("website") })}
              />
              {errors.website ? <Typography variant="error">{errors.website.message}</Typography> : null}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="size-4 text-primary" />
            <Typography as="h3" variant="h4">
              {t("socialMedia.title")}
            </Typography>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Typography as="label" variant="label" htmlFor="facebook">
                {t("socialMedia.facebook")}
              </Typography>
              <input
                id="facebook"
                className={fieldClassName}
                placeholder="https://facebook.com/your-school"
                {...register("socialMedia.facebook", { onChange: () => clearErrors("socialMedia.facebook") })}
              />
              {errors.socialMedia?.facebook ? <Typography variant="error">{errors.socialMedia.facebook.message}</Typography> : null}
            </div>

            <div className="space-y-2">
              <Typography as="label" variant="label" htmlFor="instagram">
                {t("socialMedia.instagram")}
              </Typography>
              <input
                id="instagram"
                className={fieldClassName}
                placeholder="https://instagram.com/your-school"
                {...register("socialMedia.instagram", { onChange: () => clearErrors("socialMedia.instagram") })}
              />
              {errors.socialMedia?.instagram ? (
                <Typography variant="error">{errors.socialMedia.instagram.message}</Typography>
              ) : null}
            </div>

            <div className="space-y-2">
              <Typography as="label" variant="label" htmlFor="x">
                {t("socialMedia.x")}
              </Typography>
              <input
                id="x"
                className={fieldClassName}
                placeholder="https://x.com/your-school"
                {...register("socialMedia.x", { onChange: () => clearErrors("socialMedia.x") })}
              />
              {errors.socialMedia?.x ? <Typography variant="error">{errors.socialMedia.x.message}</Typography> : null}
            </div>

            <div className="space-y-2">
              <Typography as="label" variant="label" htmlFor="linkedIn">
                {t("socialMedia.linkedIn")}
              </Typography>
              <input
                id="linkedIn"
                className={fieldClassName}
                placeholder="https://linkedin.com/school/your-school"
                {...register("socialMedia.linkedIn", { onChange: () => clearErrors("socialMedia.linkedIn") })}
              />
              {errors.socialMedia?.linkedIn ? (
                <Typography variant="error">{errors.socialMedia.linkedIn.message}</Typography>
              ) : null}
            </div>
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
