"use client";

import { CalendarClock, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DashboardPanelSkeleton } from "@/components/dashboard/loading-skeletons";
import { Typography } from "@/components/ui/typography";
import { timetableSettingsPayloadSchema, type TeachingDay, type TimetableSettingsPayloadInput } from "@/lib/validations/timetable-settings";

const fieldClassName =
  "h-11 w-full rounded-xl border border-input bg-background/80 px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";
const cardClassName = "rounded-2xl border border-border bg-card/80 p-5 shadow-xs sm:p-6";

function calculateDurationMinutes(startTime: string, endTime: string) {
  if (!startTime || !endTime) {
    return 0;
  }

  const start = new Date(`1970-01-01T${startTime}:00`);
  const end = new Date(`1970-01-01T${endTime}:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return 0;
  }

  return Math.floor((end.getTime() - start.getTime()) / 60000);
}

const defaultPayload: TimetableSettingsPayloadInput = {
  numberOfSessions: 1,
  sessions: [
    {
      name: "",
      teachingDays: [],
      startTime: "",
      endTime: "",
      durationMinutes: 0,
      requiresAttendance: true,
      hasBreakAfter: false,
      breakName: "",
      breakStartTime: "",
      breakEndTime: "",
      breakDurationMinutes: 0,
    },
  ],
};

function mapValidationMessage(key: string, tValidation: ReturnType<typeof useTranslations<"TimetableSettings.validation">>) {
  switch (key) {
    case "nameTooShort":
    case "teachingDaysRequired":
    case "invalidTime":
    case "endTimeBeforeStart":
    case "durationInvalid":
    case "breakNameTooShort":
    case "breakStartTimeRequired":
    case "breakEndTimeRequired":
    case "breakEndTimeBeforeStart":
    case "breakDurationInvalid":
    case "numberOfSessionsInvalid":
    case "sessionsCountMismatch":
      return tValidation(key);
    default:
      return tValidation("invalidField");
  }
}

export function TimetableSettingsForm() {
  const t = useTranslations("TimetableSettings");
  const validation = useTranslations("TimetableSettings.validation");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const {
    control,
    register,
    setError,
    clearErrors,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<TimetableSettingsPayloadInput>({
    defaultValues: defaultPayload,
  });

  const { fields, replace } = useFieldArray({
    control,
    name: "sessions",
  });

  const numberOfSessions = useWatch({ control, name: "numberOfSessions" });
  const sessions = useWatch({ control, name: "sessions" });

  const teachingDays = useMemo(
    () => [
      { value: "monday", label: t("days.monday") },
      { value: "tuesday", label: t("days.tuesday") },
      { value: "wednesday", label: t("days.wednesday") },
      { value: "thursday", label: t("days.thursday") },
      { value: "friday", label: t("days.friday") },
      { value: "saturday", label: t("days.saturday") },
      { value: "sunday", label: t("days.sunday") },
    ],
    [t],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const response = await fetch("/api/timetable-settings");
        if (!response.ok) {
          throw new Error("Failed to load timetable settings.");
        }
        const data = (await response.json()) as TimetableSettingsPayloadInput;
        if (isMounted) {
          reset(data);
        }
      } catch {
        if (isMounted) {
          toast.error(t("loadFailed"));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadData();
    return () => {
      isMounted = false;
    };
  }, [reset, t]);

  useEffect(() => {
    const parsedCount = Number(numberOfSessions);
    const normalizedCount = Number.isFinite(parsedCount) ? Math.min(20, Math.max(1, Math.trunc(parsedCount))) : 1;

    if (parsedCount !== normalizedCount) {
      setValue("numberOfSessions", normalizedCount, { shouldValidate: false, shouldDirty: true });
    }

    const currentSessions = getValues("sessions");
    if (currentSessions.length === normalizedCount) {
      return;
    }

    const nextSessions = Array.from({ length: normalizedCount }, (_, index) => {
      const existing = currentSessions[index];
      if (existing) {
        return existing;
      }

      return {
        name: `${t("defaults.sessionName")} ${index + 1}`,
        teachingDays: [],
        startTime: "",
        endTime: "",
        durationMinutes: 0,
        requiresAttendance: true,
        hasBreakAfter: false,
        breakName: "",
        breakStartTime: "",
        breakEndTime: "",
        breakDurationMinutes: 0,
      };
    });

    replace(nextSessions);
    clearErrors("sessions");
  }, [clearErrors, getValues, numberOfSessions, replace, setValue, t]);

  function normalizePayload(values: TimetableSettingsPayloadInput): TimetableSettingsPayloadInput {
    return {
      numberOfSessions: values.numberOfSessions,
      sessions: values.sessions.map((session) => {
        const durationMinutes = calculateDurationMinutes(session.startTime, session.endTime);
        const breakDurationMinutes =
          session.hasBreakAfter && session.breakStartTime && session.breakEndTime
            ? calculateDurationMinutes(session.breakStartTime, session.breakEndTime)
            : 0;

        return {
          ...session,
          durationMinutes,
          breakName: session.hasBreakAfter ? session.breakName : "",
          breakStartTime: session.hasBreakAfter ? session.breakStartTime : "",
          breakEndTime: session.hasBreakAfter ? session.breakEndTime : "",
          breakDurationMinutes,
        };
      }),
    };
  }

  async function handleSave(values: TimetableSettingsPayloadInput) {
    const normalized = normalizePayload(values);
    const parsed = timetableSettingsPayloadSchema.safeParse(normalized);

    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        setError(path as never, { message: mapValidationMessage(issue.message, validation) });
      });
      toast.error(validation("checkRequiredFields"));
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/timetable-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!response.ok) {
        throw new Error("Failed to save timetable settings.");
      }

      const updated = (await response.json()) as TimetableSettingsPayloadInput;
      reset(updated);
      toast.success(t("saved"));
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className={cardClassName}>
        <div className="mb-4 flex items-center gap-2">
          <CalendarClock className="size-5 text-primary" />
          <Typography as="h2" variant="h3">
            {t("title")}
          </Typography>
        </div>
        <Typography variant="muted">{t("description")}</Typography>
      </section>

      <section className={cardClassName}>
        {isLoading ? (
          <DashboardPanelSkeleton />
        ) : (
          <form onSubmit={handleSubmit(handleSave)} className="space-y-5" noValidate>
            <div className="max-w-xs space-y-2">
              <Typography as="label" variant="label" htmlFor="numberOfSessions">
                {t("fields.numberOfSessions")}
              </Typography>
              <input
                id="numberOfSessions"
                type="number"
                min={1}
                max={20}
                className={fieldClassName}
                {...register("numberOfSessions", {
                  valueAsNumber: true,
                  onChange: () => clearErrors("numberOfSessions"),
                })}
              />
              {errors.numberOfSessions ? <Typography variant="error">{errors.numberOfSessions.message}</Typography> : null}
            </div>

            {typeof errors.sessions?.message === "string" ? <Typography variant="error">{errors.sessions.message}</Typography> : null}

            <div className="space-y-4">
              {fields.map((field, index) => {
                const session = sessions?.[index];
                const durationMinutes = calculateDurationMinutes(session?.startTime ?? "", session?.endTime ?? "");
                const breakDurationMinutes =
                  session?.hasBreakAfter && session?.breakStartTime && session?.breakEndTime
                    ? calculateDurationMinutes(session.breakStartTime, session.breakEndTime)
                    : 0;

                return (
                  <div key={field.id} className="space-y-4 rounded-xl border border-border/70 p-4">
                    <Typography variant="h4">
                      {t("fields.sessionRowTitle")} {index + 1}
                    </Typography>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Typography as="label" variant="label" htmlFor={`sessions.${index}.name`}>
                          {t("fields.sessionName")}
                        </Typography>
                        <input
                          id={`sessions.${index}.name`}
                          className={fieldClassName}
                          {...register(`sessions.${index}.name`, { onChange: () => clearErrors(`sessions.${index}.name`) })}
                        />
                        {errors.sessions?.[index]?.name ? (
                          <Typography variant="error">{errors.sessions[index]?.name?.message}</Typography>
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        <Typography as="label" variant="label" htmlFor={`sessions.${index}.requiresAttendance`}>
                          {t("fields.requiresAttendance")}
                        </Typography>
                        <label className="inline-flex h-11 items-center gap-2 rounded-xl border border-border px-3 text-sm">
                          <input id={`sessions.${index}.requiresAttendance`} type="checkbox" className="size-4 accent-primary" {...register(`sessions.${index}.requiresAttendance`)} />
                          {t("fields.requiresAttendance")}
                        </label>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Typography variant="label">{t("fields.teachingDays")}</Typography>
                        <Controller
                          name={`sessions.${index}.teachingDays`}
                          control={control}
                          render={({ field: daysField }) => {
                            const currentDays = daysField.value ?? [];
                            return (
                              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                                {teachingDays.map((day) => (
                                  <label
                                    key={`${field.id}-${day.value}`}
                                    className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                                  >
                                    <input
                                      type="checkbox"
                                      className="size-4 accent-primary"
                                      checked={currentDays.includes(day.value as TeachingDay)}
                                      onChange={() => {
                                        clearErrors(`sessions.${index}.teachingDays`);
                                        const next = currentDays.includes(day.value as TeachingDay)
                                          ? currentDays.filter((item) => item !== day.value)
                                          : [...currentDays, day.value as TeachingDay];
                                        daysField.onChange(next);
                                      }}
                                    />
                                    {day.label}
                                  </label>
                                ))}
                              </div>
                            );
                          }}
                        />
                        {errors.sessions?.[index]?.teachingDays ? (
                          <Typography variant="error">{errors.sessions[index]?.teachingDays?.message as string}</Typography>
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        <Typography as="label" variant="label" htmlFor={`sessions.${index}.startTime`}>
                          {t("fields.startTime")}
                        </Typography>
                        <input
                          id={`sessions.${index}.startTime`}
                          type="time"
                          className={fieldClassName}
                          {...register(`sessions.${index}.startTime`, {
                            onChange: () => {
                              clearErrors(`sessions.${index}.startTime`);
                              clearErrors(`sessions.${index}.endTime`);
                            },
                          })}
                        />
                        {errors.sessions?.[index]?.startTime ? (
                          <Typography variant="error">{errors.sessions[index]?.startTime?.message}</Typography>
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        <Typography as="label" variant="label" htmlFor={`sessions.${index}.endTime`}>
                          {t("fields.endTime")}
                        </Typography>
                        <input
                          id={`sessions.${index}.endTime`}
                          type="time"
                          className={fieldClassName}
                          {...register(`sessions.${index}.endTime`, {
                            onChange: () => {
                              clearErrors(`sessions.${index}.endTime`);
                              clearErrors(`sessions.${index}.startTime`);
                            },
                          })}
                        />
                        {errors.sessions?.[index]?.endTime ? (
                          <Typography variant="error">{errors.sessions[index]?.endTime?.message}</Typography>
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        <Typography variant="label">{t("fields.durationMinutes")}</Typography>
                        <input type="number" className={fieldClassName} value={durationMinutes} readOnly />
                      </div>
                    </div>

                    <div className="space-y-3 rounded-xl border border-border/70 p-3">
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="size-4 accent-primary"
                          {...register(`sessions.${index}.hasBreakAfter`, {
                            onChange: (event) => {
                              const isChecked = Boolean((event.target as HTMLInputElement).checked);
                              if (!isChecked) {
                                setValue(`sessions.${index}.breakName`, "");
                                setValue(`sessions.${index}.breakStartTime`, "");
                                setValue(`sessions.${index}.breakEndTime`, "");
                                setValue(`sessions.${index}.breakDurationMinutes`, 0);
                                clearErrors(`sessions.${index}.breakName`);
                                clearErrors(`sessions.${index}.breakStartTime`);
                                clearErrors(`sessions.${index}.breakEndTime`);
                              }
                            },
                          })}
                        />
                        {t("fields.hasBreakAfter")}
                      </label>

                      {session?.hasBreakAfter ? (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div className="space-y-2 md:col-span-2">
                            <Typography as="label" variant="label" htmlFor={`sessions.${index}.breakName`}>
                              {t("fields.breakName")}
                            </Typography>
                            <input
                              id={`sessions.${index}.breakName`}
                              className={fieldClassName}
                              {...register(`sessions.${index}.breakName`, {
                                onChange: () => clearErrors(`sessions.${index}.breakName`),
                              })}
                            />
                            {errors.sessions?.[index]?.breakName ? (
                              <Typography variant="error">{errors.sessions[index]?.breakName?.message}</Typography>
                            ) : null}
                          </div>

                          <div className="space-y-2">
                            <Typography as="label" variant="label" htmlFor={`sessions.${index}.breakStartTime`}>
                              {t("fields.breakStartTime")}
                            </Typography>
                            <input
                              id={`sessions.${index}.breakStartTime`}
                              type="time"
                              className={fieldClassName}
                              {...register(`sessions.${index}.breakStartTime`, {
                                onChange: () => {
                                  clearErrors(`sessions.${index}.breakStartTime`);
                                  clearErrors(`sessions.${index}.breakEndTime`);
                                },
                              })}
                            />
                            {errors.sessions?.[index]?.breakStartTime ? (
                              <Typography variant="error">{errors.sessions[index]?.breakStartTime?.message}</Typography>
                            ) : null}
                          </div>

                          <div className="space-y-2">
                            <Typography as="label" variant="label" htmlFor={`sessions.${index}.breakEndTime`}>
                              {t("fields.breakEndTime")}
                            </Typography>
                            <input
                              id={`sessions.${index}.breakEndTime`}
                              type="time"
                              className={fieldClassName}
                              {...register(`sessions.${index}.breakEndTime`, {
                                onChange: () => {
                                  clearErrors(`sessions.${index}.breakEndTime`);
                                  clearErrors(`sessions.${index}.breakStartTime`);
                                },
                              })}
                            />
                            {errors.sessions?.[index]?.breakEndTime ? (
                              <Typography variant="error">{errors.sessions[index]?.breakEndTime?.message}</Typography>
                            ) : null}
                          </div>

                          <div className="space-y-2">
                            <Typography variant="label">{t("fields.breakDurationMinutes")}</Typography>
                            <input type="number" className={fieldClassName} value={breakDurationMinutes} readOnly />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end">
              <Button type="submit" disabled={isSaving || isSubmitting}>
                <Save className="size-4" />
                {isSaving || isSubmitting ? t("saving") : t("save")}
              </Button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
