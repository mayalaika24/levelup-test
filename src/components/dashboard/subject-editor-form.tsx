"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { DashboardPanelSkeleton } from "@/components/dashboard/loading-skeletons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import { type GradeInput } from "@/lib/validations/grade";
import { subjectPayloadSchema, type SubjectInput, type SubjectPayloadInput } from "@/lib/validations/subject";

type UserInput = {
  id: string;
  name: string;
  role: string;
};

type SubjectEditorFormProps = {
  mode: "create" | "edit";
  subjectId?: string;
};

const fieldClassName =
  "h-11 w-full rounded-xl border border-input bg-background/80 px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";
const cardClassName = "rounded-2xl border border-border bg-card/80 p-5 shadow-xs sm:p-6";

const emptyPayload: SubjectPayloadInput = {
  name: "",
  type: "core",
  teachingLanguage: "",
  gradeConfigs: [{ gradeId: "", weeklySessions: 3, lessonDurationMinutes: 45 }],
  teacherIds: [],
  includedInAverage: true,
  needsLab: false,
  hasQuestionBank: false,
  minimumPassingGrade: 50,
  scoreBreakdown: [{ activityName: "", percentage: 100 }],
};

function mapValidationMessage(key: string, tValidation: ReturnType<typeof useTranslations<"Subjects.validation">>) {
  switch (key) {
    case "nameTooShort":
    case "teachingLanguageTooShort":
    case "minimumPassingGradeInvalid":
    case "atLeastOneGradeConfig":
    case "gradeRequired":
    case "weeklySessionsInvalid":
    case "lessonDurationInvalid":
    case "atLeastOneTeacher":
    case "duplicateTeacher":
    case "atLeastOneScoreBreakdown":
    case "activityNameTooShort":
    case "activityPercentageInvalid":
    case "duplicateGradeConfig":
    case "scoreBreakdownMustTotal100":
      return tValidation(key);
    default:
      return tValidation("invalidField");
  }
}

export function SubjectEditorForm({ mode, subjectId }: SubjectEditorFormProps) {
  const t = useTranslations("Subjects");
  const validation = useTranslations("Subjects.validation");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [grades, setGrades] = useState<GradeInput[]>([]);
  const [users, setUsers] = useState<UserInput[]>([]);

  const {
    register,
    control,
    setError,
    clearErrors,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SubjectPayloadInput>({
    defaultValues: emptyPayload,
  });

  const {
    fields: gradeConfigFields,
    append: appendGradeConfig,
    remove: removeGradeConfig,
  } = useFieldArray({
    control,
    name: "gradeConfigs",
  });

  const {
    fields: scoreBreakdownFields,
    append: appendScoreBreakdown,
    remove: removeScoreBreakdown,
  } = useFieldArray({
    control,
    name: "scoreBreakdown",
  });

  const selectedTeacherIds = useWatch({
    control,
    name: "teacherIds",
  });
  const selectedScoreBreakdown = useWatch({
    control,
    name: "scoreBreakdown",
  });

  const totalScorePercentage = useMemo(
    () => selectedScoreBreakdown?.reduce((sum, item) => sum + (Number(item.percentage) || 0), 0) ?? 0,
    [selectedScoreBreakdown],
  );

  useEffect(() => {
    // Clear stale root-level score breakdown error once sum reaches 100.
    if (Math.round(totalScorePercentage * 100) / 100 === 100) {
      clearErrors("scoreBreakdown");
    }
  }, [clearErrors, totalScorePercentage]);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [gradesResponse, usersResponse, subjectsResponse] = await Promise.all([
          fetch("/api/grades"),
          fetch("/api/users"),
          mode === "edit" ? fetch("/api/subjects") : Promise.resolve(null),
        ]);

        if (!gradesResponse.ok || !usersResponse.ok) {
          throw new Error("Failed to load editor data.");
        }

        const gradesData = (await gradesResponse.json()) as GradeInput[];
        const usersData = (await usersResponse.json()) as UserInput[];

        let nextSubjectData = emptyPayload;
        if (mode === "edit") {
          if (!subjectsResponse || !subjectsResponse.ok) {
            throw new Error("Failed to load subject for editing.");
          }
          const allSubjects = (await subjectsResponse.json()) as SubjectInput[];
          const found = allSubjects.find((item) => item.id === subjectId);
          if (!found) {
            throw new Error("Subject not found.");
          }
          nextSubjectData = {
            name: found.name,
            type: found.type,
            teachingLanguage: found.teachingLanguage,
            gradeConfigs: found.gradeConfigs,
            teacherIds: found.teacherIds,
            includedInAverage: found.includedInAverage,
            needsLab: found.needsLab,
            hasQuestionBank: found.hasQuestionBank,
            minimumPassingGrade: found.minimumPassingGrade,
            scoreBreakdown: found.scoreBreakdown,
          };
        }

        if (!isMounted) {
          return;
        }

        setGrades(gradesData);
        setUsers(usersData);
        reset(nextSubjectData);
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
  }, [mode, reset, subjectId, t]);

  function toggleTeacher(teacherId: string) {
    const current = selectedTeacherIds ?? [];
    if (current.includes(teacherId)) {
      clearErrors("teacherIds");
      return current.filter((id) => id !== teacherId);
    }
    clearErrors("teacherIds");
    return [...current, teacherId];
  }

  async function handleSave(values: SubjectPayloadInput) {
    const parsed = subjectPayloadSchema.safeParse(values);

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
      const response = await fetch("/api/subjects", {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "create" ? parsed.data : { ...parsed.data, id: subjectId }),
      });

      if (response.status === 409) {
        const message = validation("duplicateName");
        setError("name", { message });
        toast.error(message);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to save subject.");
      }

      toast.success(t("saved"));
      router.push("/dashboard/subjects");
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className={cardClassName}>
        <div className="mb-5 flex items-center justify-between gap-3">
          <Typography as="h2" variant="h3">
            {mode === "create" ? t("dialogs.addTitle") : t("dialogs.editTitle")}
          </Typography>
          <Link href="/dashboard/subjects" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <ArrowLeft className="size-4" />
            {t("cancel")}
          </Link>
        </div>

        {isLoading ? (
          <DashboardPanelSkeleton />
        ) : (
          <form onSubmit={handleSubmit(handleSave)} className="space-y-6" noValidate>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Typography as="label" variant="label" htmlFor="name">
                  {t("fields.name")}
                </Typography>
                <input id="name" className={fieldClassName} {...register("name", { onChange: () => clearErrors("name") })} />
                {errors.name ? <Typography variant="error">{errors.name.message}</Typography> : null}
              </div>

              <div className="space-y-2">
                <Typography as="label" variant="label" htmlFor="type">
                  {t("fields.type")}
                </Typography>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="type" className={fieldClassName}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="core">{t("types.core")}</SelectItem>
                        <SelectItem value="enrichment">{t("types.enrichment")}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Typography as="label" variant="label" htmlFor="teachingLanguage">
                  {t("fields.teachingLanguage")}
                </Typography>
                <input
                  id="teachingLanguage"
                  className={fieldClassName}
                  {...register("teachingLanguage", { onChange: () => clearErrors("teachingLanguage") })}
                />
                {errors.teachingLanguage ? <Typography variant="error">{errors.teachingLanguage.message}</Typography> : null}
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-border/70 p-4">
              <div className="flex items-center justify-between">
                <Typography variant="h4">{t("fields.gradeConfigsTitle")}</Typography>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    clearErrors("gradeConfigs");
                    appendGradeConfig({ gradeId: "", weeklySessions: 3, lessonDurationMinutes: 45 });
                  }}
                >
                  <Plus className="size-4" />
                  {t("fields.addGradeConfig")}
                </Button>
              </div>
              {typeof errors.gradeConfigs?.message === "string" ? (
                <Typography variant="error">{errors.gradeConfigs.message}</Typography>
              ) : null}
              <div className="space-y-3">
                {gradeConfigFields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 gap-3 rounded-xl border border-border/70 p-3 md:grid-cols-12">
                    <div className="md:col-span-5 space-y-2">
                      <Typography variant="caption">{t("fields.grade")}</Typography>
                      <Controller
                        name={`gradeConfigs.${index}.gradeId`}
                        control={control}
                        render={({ field: gradeField }) => (
                          <Select
                            value={gradeField.value}
                            onValueChange={(value) => {
                              clearErrors(`gradeConfigs.${index}.gradeId`);
                              gradeField.onChange(value);
                            }}
                          >
                            <SelectTrigger className={fieldClassName}>
                              <SelectValue placeholder={t("fields.selectGrade")} />
                            </SelectTrigger>
                            <SelectContent>
                              {grades.map((grade) => (
                                <SelectItem key={grade.id} value={grade.id}>
                                  {grade.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.gradeConfigs?.[index]?.gradeId ? (
                        <Typography variant="error">{errors.gradeConfigs[index]?.gradeId?.message}</Typography>
                      ) : null}
                    </div>
                    <div className="md:col-span-3 space-y-2">
                      <Typography variant="caption">{t("fields.weeklySessions")}</Typography>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        className={fieldClassName}
                        {...register(`gradeConfigs.${index}.weeklySessions`, {
                          valueAsNumber: true,
                          onChange: () => clearErrors(`gradeConfigs.${index}.weeklySessions`),
                        })}
                      />
                    </div>
                    <div className="md:col-span-3 space-y-2">
                      <Typography variant="caption">{t("fields.lessonDurationMinutes")}</Typography>
                      <input
                        type="number"
                        min={20}
                        max={180}
                        className={fieldClassName}
                        {...register(`gradeConfigs.${index}.lessonDurationMinutes`, {
                          valueAsNumber: true,
                          onChange: () => clearErrors(`gradeConfigs.${index}.lessonDurationMinutes`),
                        })}
                      />
                    </div>
                    <div className="md:col-span-1 flex items-end">
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon-sm"
                        onClick={() => {
                          clearErrors("gradeConfigs");
                          removeGradeConfig(index);
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-border/70 p-4">
              <Typography variant="h4">{t("fields.teachers")}</Typography>
              {errors.teacherIds?.message ? <Typography variant="error">{errors.teacherIds.message}</Typography> : null}
              <Controller
                name="teacherIds"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {users.map((user) => (
                      <label key={user.id} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                        <input
                          type="checkbox"
                          className="size-4 accent-primary"
                          checked={(field.value ?? []).includes(user.id)}
                          onChange={() => field.onChange(toggleTeacher(user.id))}
                        />
                        {user.name}
                      </label>
                    ))}
                  </div>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <label className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-foreground">
                <input type="checkbox" className="size-4 accent-primary" {...register("includedInAverage")} />
                {t("fields.includedInAverage")}
              </label>
              <label className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-foreground">
                <input type="checkbox" className="size-4 accent-primary" {...register("needsLab")} />
                {t("fields.needsLab")}
              </label>
              <label className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-foreground">
                <input type="checkbox" className="size-4 accent-primary" {...register("hasQuestionBank")} />
                {t("fields.hasQuestionBank")}
              </label>
            </div>

            <div className="space-y-2">
              <Typography as="label" variant="label" htmlFor="minimumPassingGrade">
                {t("fields.minimumPassingGrade")}
              </Typography>
              <input
                id="minimumPassingGrade"
                type="number"
                min={0}
                max={100}
                className={fieldClassName}
                {...register("minimumPassingGrade", { valueAsNumber: true, onChange: () => clearErrors("minimumPassingGrade") })}
              />
              {errors.minimumPassingGrade ? <Typography variant="error">{errors.minimumPassingGrade.message}</Typography> : null}
            </div>

            <div className="space-y-3 rounded-xl border border-border/70 p-4">
              <div className="flex items-center justify-between">
                <Typography variant="h4">{t("fields.scoreBreakdownTitle")}</Typography>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    clearErrors("scoreBreakdown");
                    appendScoreBreakdown({ activityName: "", percentage: 0 });
                  }}
                >
                  <Plus className="size-4" />
                  {t("fields.addScoreBreakdown")}
                </Button>
              </div>
              {typeof errors.scoreBreakdown?.message === "string" ? (
                <Typography variant="error">{errors.scoreBreakdown.message}</Typography>
              ) : null}
              <Typography variant="caption">
                {t("fields.totalPercentage")}: {totalScorePercentage}%
              </Typography>
              <div className="space-y-3">
                {scoreBreakdownFields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 gap-3 rounded-xl border border-border/70 p-3 md:grid-cols-12">
                    <div className="md:col-span-7 space-y-2">
                      <Typography variant="caption">{t("fields.activityName")}</Typography>
                      <input
                        className={fieldClassName}
                        {...register(`scoreBreakdown.${index}.activityName`, {
                          onChange: () => {
                            clearErrors("scoreBreakdown");
                            clearErrors(`scoreBreakdown.${index}.activityName`);
                          },
                        })}
                      />
                    </div>
                    <div className="md:col-span-4 space-y-2">
                      <Typography variant="caption">{t("fields.activityPercentage")}</Typography>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        className={fieldClassName}
                        {...register(`scoreBreakdown.${index}.percentage`, {
                          valueAsNumber: true,
                          onChange: () => {
                            clearErrors("scoreBreakdown");
                            clearErrors(`scoreBreakdown.${index}.percentage`);
                          },
                        })}
                      />
                    </div>
                    <div className="md:col-span-1 flex items-end">
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon-sm"
                        onClick={() => {
                          clearErrors("scoreBreakdown");
                          removeScoreBreakdown(index);
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.push("/dashboard/subjects")}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isSaving || isSubmitting}>
                <Save className="size-4" />
                {isSaving || isSubmitting ? t("saving") : mode === "create" ? t("create") : t("update")}
              </Button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
