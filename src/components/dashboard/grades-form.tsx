"use client";

import { BookOpen, PencilLine, Plus, Save, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DashboardPanelSkeleton } from "@/components/dashboard/loading-skeletons";
import { DynamicTable, type DynamicTableColumn } from "@/components/ui/dynamic-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import { type EducationalStageInput } from "@/lib/validations/educational-stage";
import { gradePayloadSchema, type GradeInput, type GradePayloadInput } from "@/lib/validations/grade";

const fieldClassName =
  "h-11 w-full rounded-xl border border-input bg-background/80 px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";
const selectTriggerClassName =
  "h-11 w-full rounded-xl border-input bg-background/80 px-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/30";
const cardClassName = "rounded-2xl border border-border bg-card/80 p-5 shadow-xs sm:p-6";

const emptyPayload: GradePayloadInput = {
  name: "",
  educationalStageId: "",
  minimumPassingGrade: 50,
  isActive: false,
};

type GradeDialogProps = {
  open: boolean;
  title: string;
  submitLabel: string;
  onClose: () => void;
  onSubmit: (values: GradePayloadInput, setFieldError: (message: string) => void) => Promise<void>;
  isSaving: boolean;
  initialValues: GradePayloadInput;
  stages: EducationalStageInput[];
};

function GradeDialog({ open, title, submitLabel, onClose, onSubmit, isSaving, initialValues, stages }: GradeDialogProps) {
  const t = useTranslations("Grades");
  const validation = useTranslations("Grades.validation");
  const {
    register,
    control,
    setError,
    clearErrors,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GradePayloadInput>({
    defaultValues: initialValues,
  });

  useEffect(() => {
    if (open) {
      reset(initialValues);
    }
  }, [initialValues, open, reset]);

  async function handleSave(values: GradePayloadInput) {
    const parsed = gradePayloadSchema.safeParse(values);

    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const key = issue.message;
        const message =
          key === "nameTooShort"
            ? validation("nameTooShort")
            : key === "educationalStageRequired"
              ? validation("educationalStageRequired")
              : key === "minimumPassingGradeInvalid"
                ? validation("minimumPassingGradeInvalid")
                : validation("invalidField");
        setError(issue.path.join(".") as never, { message });
      });
      toast.error(validation("checkRequiredFields"));
      return;
    }

    await onSubmit(parsed.data, (message) => {
      setError("name", { message });
    });
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-5 shadow-xl sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <Typography as="h3" variant="h3">
            {title}
          </Typography>
          <Button type="button" variant="ghost" size="icon-sm" onClick={onClose} aria-label={t("closeDialog")}>
            <X className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit(handleSave)} className="space-y-5" noValidate>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Typography as="label" variant="label" htmlFor="name">
                {t("fields.name")}
              </Typography>
              <input id="name" className={fieldClassName} {...register("name", { onChange: () => clearErrors("name") })} />
              {errors.name ? <Typography variant="error">{errors.name.message}</Typography> : null}
            </div>

            <div className="space-y-2">
              <Typography as="label" variant="label" htmlFor="educationalStageId">
                {t("fields.educationalStage")}
              </Typography>
              <Controller
                name="educationalStageId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(value) => {
                      clearErrors("educationalStageId");
                      field.onChange(value);
                    }}
                  >
                    <SelectTrigger id="educationalStageId" className={selectTriggerClassName}>
                      <SelectValue placeholder={t("fields.selectEducationalStage")} />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.id}>
                          {stage.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.educationalStageId ? <Typography variant="error">{errors.educationalStageId.message}</Typography> : null}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Typography as="label" variant="label" htmlFor="minimumPassingGrade">
                {t("fields.minimumPassingGrade")}
              </Typography>
              <input
                id="minimumPassingGrade"
                type="number"
                min={0}
                max={100}
                className={fieldClassName}
                {...register("minimumPassingGrade", {
                  valueAsNumber: true,
                  onChange: () => clearErrors("minimumPassingGrade"),
                })}
              />
              {errors.minimumPassingGrade ? <Typography variant="error">{errors.minimumPassingGrade.message}</Typography> : null}
            </div>
          </div>

          <label className="inline-flex items-start gap-2 rounded-xl border border-border px-3 py-2 text-sm text-foreground">
            <input type="checkbox" className="mt-0.5 size-4 accent-primary" {...register("isActive")} />
            <span className="space-y-1">
              <span className="block font-medium">{t("fields.isActive")}</span>
              <span className="block text-xs text-muted-foreground">{t("activeHelpText")}</span>
            </span>
          </label>

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isSaving || isSubmitting}>
              <Save className="size-4" />
              {isSaving || isSubmitting ? t("saving") : submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

type DeleteDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
};

function DeleteDialog({ open, onClose, onConfirm, isDeleting }: DeleteDialogProps) {
  const t = useTranslations("Grades");

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl sm:p-6">
        <Typography as="h3" variant="h3" className="mb-3">
          {t("dialogs.deleteTitle")}
        </Typography>
        <Typography variant="muted" className="mb-5">
          {t("deleteConfirm")}
        </Typography>
        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isDeleting}>
            {t("cancel")}
          </Button>
          <Button type="button" variant="destructive" onClick={() => void onConfirm()} disabled={isDeleting}>
            <Trash2 className="size-4" />
            {isDeleting ? t("saving") : t("delete")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function GradesForm() {
  const t = useTranslations("Grades");
  const validation = useTranslations("Grades.validation");
  const [grades, setGrades] = useState<GradeInput[]>([]);
  const [stages, setStages] = useState<EducationalStageInput[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GradeInput | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<GradeInput | null>(null);

  const stageNameById = useMemo(
    () =>
      stages.reduce<Record<string, string>>((acc, stage) => {
        acc[stage.id] = stage.name;
        return acc;
      }, {}),
    [stages],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [gradesResponse, stagesResponse] = await Promise.all([
          fetch("/api/grades"),
          fetch("/api/educational-stages"),
        ]);

        if (!gradesResponse.ok || !stagesResponse.ok) {
          throw new Error("Failed to load grades data.");
        }

        const gradesData = (await gradesResponse.json()) as GradeInput[];
        const stagesData = (await stagesResponse.json()) as EducationalStageInput[];
        if (isMounted) {
          setGrades(gradesData);
          setStages(stagesData);
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
  }, [t]);

  async function handleCreate(values: GradePayloadInput, setFieldError: (message: string) => void) {
    setIsSaving(true);
    try {
      const response = await fetch("/api/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (response.status === 409) {
        const message = validation("duplicateName");
        setFieldError(message);
        toast.error(message);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to create grade.");
      }

      const updated = (await response.json()) as GradeInput[];
      setGrades(updated);
      setIsCreateDialogOpen(false);
      toast.success(t("saved"));
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdate(values: GradePayloadInput, setFieldError: (message: string) => void) {
    if (!editingItem) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/grades", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, id: editingItem.id }),
      });

      if (response.status === 409) {
        const message = validation("duplicateName");
        setFieldError(message);
        toast.error(message);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to update grade.");
      }

      const updated = (await response.json()) as GradeInput[];
      setGrades(updated);
      setEditingItem(null);
      toast.success(t("saved"));
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteCandidate) {
      return;
    }
    setIsSaving(true);
    try {
      const response = await fetch(`/api/grades?id=${encodeURIComponent(deleteCandidate.id)}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete grade.");
      }
      const updated = (await response.json()) as GradeInput[];
      setGrades(updated);
      setDeleteCandidate(null);
      toast.success(t("deleted"));
    } catch {
      toast.error(t("deleteFailed"));
    } finally {
      setIsSaving(false);
    }
  }

  const columns = useMemo<DynamicTableColumn<GradeInput>[]>(
    () => [
      {
        key: "name",
        header: t("table.name"),
        render: (row) => row.name,
      },
      {
        key: "educationalStage",
        header: t("table.educationalStage"),
        render: (row) => stageNameById[row.educationalStageId] ?? "-",
      },
      {
        key: "minimumPassingGrade",
        header: t("table.minimumPassingGrade"),
        render: (row) => `${row.minimumPassingGrade}%`,
      },
      {
        key: "isActive",
        header: t("table.isActive"),
        render: (row) => (row.isActive ? t("yes") : t("no")),
      },
      {
        key: "actions",
        header: t("table.actions"),
        className: "w-[180px]",
        render: (row) => (
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditingItem(row)}>
              <PencilLine className="size-4" />
              {t("edit")}
            </Button>
            <Button type="button" variant="destructive" size="sm" onClick={() => setDeleteCandidate(row)}>
              <Trash2 className="size-4" />
              {t("delete")}
            </Button>
          </div>
        ),
      },
    ],
    [stageNameById, t],
  );

  return (
    <>
      <GradeDialog
        key={`create-grade-dialog`}
        open={isCreateDialogOpen}
        title={t("dialogs.addTitle")}
        submitLabel={t("create")}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreate}
        isSaving={isSaving}
        initialValues={emptyPayload}
        stages={stages}
      />
      <GradeDialog
        key={`edit-grade-dialog-${editingItem?.id ?? "none"}`}
        open={Boolean(editingItem)}
        title={t("dialogs.editTitle")}
        submitLabel={t("update")}
        onClose={() => setEditingItem(null)}
        onSubmit={handleUpdate}
        isSaving={isSaving}
        initialValues={
          editingItem
            ? {
                name: editingItem.name,
                educationalStageId: editingItem.educationalStageId,
                minimumPassingGrade: editingItem.minimumPassingGrade,
                isActive: editingItem.isActive,
              }
            : emptyPayload
        }
        stages={stages}
      />
      <DeleteDialog
        open={Boolean(deleteCandidate)}
        onClose={() => setDeleteCandidate(null)}
        onConfirm={handleDelete}
        isDeleting={isSaving}
      />

      <div className="space-y-6">
        <section className={cardClassName}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BookOpen className="size-5 text-primary" />
              <Typography as="h2" variant="h3">
                {t("title")}
              </Typography>
            </div>
            <Button type="button" size="sm" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="size-4" />
              {t("newGrade")}
            </Button>
          </div>
          <Typography variant="muted">{t("description")}</Typography>
        </section>

        <section className={cardClassName}>
          <Typography as="h3" variant="h4" className="mb-4">
            {t("existingGrades")}
          </Typography>
          {isLoading ? (
            <DashboardPanelSkeleton />
          ) : (
            <DynamicTable data={grades} columns={columns} getRowKey={(row) => row.id} emptyMessage={t("emptyState")} />
          )}
        </section>
      </div>
    </>
  );
}
