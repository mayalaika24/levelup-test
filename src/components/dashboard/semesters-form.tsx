"use client";

import { Calendar, PencilLine, Plus, Save, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DashboardPanelSkeleton } from "@/components/dashboard/loading-skeletons";
import { DynamicTable, type DynamicTableColumn } from "@/components/ui/dynamic-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import { type AcademicYearInput } from "@/lib/validations/academic-year";
import {
  semesterPayloadSchema,
  type SemesterInput,
  type SemesterPayloadInput,
} from "@/lib/validations/semester";

const fieldClassName =
  "h-11 w-full rounded-xl border border-input bg-background/80 px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";
const selectTriggerClassName =
  "h-11 w-full rounded-xl border-input bg-background/80 px-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/30";
const cardClassName = "rounded-2xl border border-border bg-card/80 p-5 shadow-xs sm:p-6";

const emptyPayload: SemesterPayloadInput = {
  name: "",
  academicYearId: "",
  semesterStartDate: "",
  semesterEndDate: "",
  classesStartDate: "",
  classesEndDate: "",
  finalExamDate: "",
  assessmentType: "monthly",
};

type SemesterDialogProps = {
  open: boolean;
  title: string;
  submitLabel: string;
  onClose: () => void;
  onSubmit: (values: SemesterPayloadInput) => Promise<void>;
  isSaving: boolean;
  initialValues: SemesterPayloadInput;
  academicYears: AcademicYearInput[];
};

function SemesterDialog({
  open,
  title,
  submitLabel,
  onClose,
  onSubmit,
  isSaving,
  initialValues,
  academicYears,
}: SemesterDialogProps) {
  const t = useTranslations("Semesters");
  const validation = useTranslations("Semesters.validation");
  const {
    register,
    control,
    setError,
    clearErrors,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SemesterPayloadInput>({
    defaultValues: initialValues,
  });

  useEffect(() => {
    if (open) {
      reset(initialValues);
    }
  }, [initialValues, open, reset]);

  async function handleSave(values: SemesterPayloadInput) {
    const parsed = semesterPayloadSchema.safeParse(values);

    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const fieldKey = String(issue.path[0] ?? "");
        const message = issue.message;

        const resolvedMessage =
          message === "semesterEndBeforeStart"
            ? validation("semesterEndBeforeStart")
            : message === "classesEndBeforeStart"
              ? validation("classesEndBeforeStart")
              : message === "finalExamBeforeSemesterStart"
                ? validation("finalExamBeforeSemesterStart")
                : message === "nameTooShort"
                  ? validation("nameTooShort")
                  : message === "academicYearRequired"
                    ? validation("academicYearRequired")
                    : fieldKey === "semesterStartDate"
                      ? validation("semesterStartDateRequired")
                      : fieldKey === "semesterEndDate"
                        ? validation("semesterEndDateRequired")
                        : fieldKey === "classesStartDate"
                          ? validation("classesStartDateRequired")
                          : fieldKey === "classesEndDate"
                            ? validation("classesEndDateRequired")
                            : fieldKey === "finalExamDate"
                              ? validation("finalExamDateRequired")
                              : fieldKey === "assessmentType"
                                ? validation("assessmentTypeRequired")
                                : validation("invalidField");

        setError(issue.path.join(".") as never, { message: resolvedMessage });
      });
      toast.error(validation("checkRequiredFields"));
      return;
    }

    await onSubmit(parsed.data);
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-border bg-card p-5 shadow-xl sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <Typography as="h3" variant="h3">
            {title}
          </Typography>
          <Button type="button" variant="ghost" size="icon-sm" onClick={onClose} aria-label={t("closeDialog")}>
            <X className="size-4" />
          </Button>
        </div>

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
              <Typography as="label" variant="label" htmlFor="academicYearId">
                {t("fields.academicYear")}
              </Typography>
              <Controller
                name="academicYearId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      clearErrors("academicYearId");
                      field.onChange(value);
                    }}
                  >
                    <SelectTrigger id="academicYearId" className={selectTriggerClassName}>
                      <SelectValue placeholder={t("fields.selectAcademicYear")} />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYears.map((year) => (
                        <SelectItem key={year.id} value={year.id}>
                          {year.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.academicYearId ? <Typography variant="error">{errors.academicYearId.message}</Typography> : null}
            </div>

            <div className="space-y-2">
              <Typography as="label" variant="label" htmlFor="semesterStartDate">
                {t("fields.semesterStartDate")}
              </Typography>
              <input
                id="semesterStartDate"
                type="date"
                className={fieldClassName}
                {...register("semesterStartDate", { onChange: () => clearErrors("semesterStartDate") })}
              />
              {errors.semesterStartDate ? <Typography variant="error">{errors.semesterStartDate.message}</Typography> : null}
            </div>

            <div className="space-y-2">
              <Typography as="label" variant="label" htmlFor="semesterEndDate">
                {t("fields.semesterEndDate")}
              </Typography>
              <input
                id="semesterEndDate"
                type="date"
                className={fieldClassName}
                {...register("semesterEndDate", { onChange: () => clearErrors("semesterEndDate") })}
              />
              {errors.semesterEndDate ? <Typography variant="error">{errors.semesterEndDate.message}</Typography> : null}
            </div>

            <div className="space-y-2">
              <Typography as="label" variant="label" htmlFor="classesStartDate">
                {t("fields.classesStartDate")}
              </Typography>
              <input
                id="classesStartDate"
                type="date"
                className={fieldClassName}
                {...register("classesStartDate", { onChange: () => clearErrors("classesStartDate") })}
              />
              {errors.classesStartDate ? <Typography variant="error">{errors.classesStartDate.message}</Typography> : null}
            </div>

            <div className="space-y-2">
              <Typography as="label" variant="label" htmlFor="classesEndDate">
                {t("fields.classesEndDate")}
              </Typography>
              <input
                id="classesEndDate"
                type="date"
                className={fieldClassName}
                {...register("classesEndDate", { onChange: () => clearErrors("classesEndDate") })}
              />
              {errors.classesEndDate ? <Typography variant="error">{errors.classesEndDate.message}</Typography> : null}
            </div>

            <div className="space-y-2">
              <Typography as="label" variant="label" htmlFor="finalExamDate">
                {t("fields.finalExamDate")}
              </Typography>
              <input
                id="finalExamDate"
                type="date"
                className={fieldClassName}
                {...register("finalExamDate", { onChange: () => clearErrors("finalExamDate") })}
              />
              {errors.finalExamDate ? <Typography variant="error">{errors.finalExamDate.message}</Typography> : null}
            </div>

            <div className="space-y-2">
              <Typography as="label" variant="label" htmlFor="assessmentType">
                {t("fields.assessmentType")}
              </Typography>
              <Controller
                name="assessmentType"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      clearErrors("assessmentType");
                      field.onChange(value);
                    }}
                  >
                    <SelectTrigger id="assessmentType" className={selectTriggerClassName}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">{t("assessmentTypes.monthly")}</SelectItem>
                      <SelectItem value="midterm">{t("assessmentTypes.midterm")}</SelectItem>
                      <SelectItem value="final">{t("assessmentTypes.final")}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.assessmentType ? <Typography variant="error">{errors.assessmentType.message}</Typography> : null}
            </div>
          </div>

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
  const t = useTranslations("Semesters");

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

export function SemestersForm() {
  const t = useTranslations("Semesters");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [semesters, setSemesters] = useState<SemesterInput[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYearInput[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SemesterInput | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<SemesterInput | null>(null);

  const sortedSemesters = useMemo(
    () => [...semesters].sort((a, b) => b.semesterStartDate.localeCompare(a.semesterStartDate)),
    [semesters],
  );

  const academicYearNameById = useMemo(
    () =>
      academicYears.reduce<Record<string, string>>((acc, year) => {
        acc[year.id] = year.name;
        return acc;
      }, {}),
    [academicYears],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [semestersResponse, yearsResponse] = await Promise.all([
          fetch("/api/semesters"),
          fetch("/api/academic-years"),
        ]);

        if (!semestersResponse.ok || !yearsResponse.ok) {
          throw new Error("Failed to load semesters data.");
        }

        const semestersData = (await semestersResponse.json()) as SemesterInput[];
        const yearsData = (await yearsResponse.json()) as AcademicYearInput[];

        if (isMounted) {
          setSemesters(semestersData);
          setAcademicYears(yearsData);
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

  async function handleCreate(values: SemesterPayloadInput) {
    setIsSaving(true);
    try {
      const response = await fetch("/api/semesters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Failed to create semester.");
      }

      const updated = (await response.json()) as SemesterInput[];
      setSemesters(updated);
      setIsCreateDialogOpen(false);
      toast.success(t("saved"));
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdate(values: SemesterPayloadInput) {
    if (!editingItem) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/semesters", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, id: editingItem.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to update semester.");
      }

      const updated = (await response.json()) as SemesterInput[];
      setSemesters(updated);
      setEditingItem(null);
      toast.success(t("saved"));
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setIsSaving(false);
    }
  }

  async function performDelete() {
    if (!deleteCandidate) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/semesters?id=${encodeURIComponent(deleteCandidate.id)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete semester.");
      }

      const updated = (await response.json()) as SemesterInput[];
      setSemesters(updated);
      setDeleteCandidate(null);
      toast.success(t("deleted"));
    } catch {
      toast.error(t("deleteFailed"));
    } finally {
      setIsSaving(false);
    }
  }

  const columns = useMemo<DynamicTableColumn<SemesterInput>[]>(
    () => [
      {
        key: "name",
        header: t("table.name"),
        render: (row) => row.name,
      },
      {
        key: "academicYear",
        header: t("table.academicYear"),
        render: (row) => academicYearNameById[row.academicYearId] ?? "-",
      },
      {
        key: "semesterRange",
        header: t("table.semesterRange"),
        render: (row) => `${row.semesterStartDate} - ${row.semesterEndDate}`,
      },
      {
        key: "classesRange",
        header: t("table.classesRange"),
        render: (row) => `${row.classesStartDate} - ${row.classesEndDate}`,
      },
      {
        key: "finalExamDate",
        header: t("table.finalExamDate"),
        render: (row) => row.finalExamDate,
      },
      {
        key: "assessmentType",
        header: t("table.assessmentType"),
        render: (row) => t(`assessmentTypes.${row.assessmentType}`),
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
    [academicYearNameById, t],
  );

  return (
    <>
      <SemesterDialog
        open={isCreateDialogOpen}
        title={t("dialogs.addTitle")}
        submitLabel={t("create")}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreate}
        isSaving={isSaving}
        initialValues={emptyPayload}
        academicYears={academicYears}
      />
      <SemesterDialog
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
                academicYearId: editingItem.academicYearId,
                semesterStartDate: editingItem.semesterStartDate,
                semesterEndDate: editingItem.semesterEndDate,
                classesStartDate: editingItem.classesStartDate,
                classesEndDate: editingItem.classesEndDate,
                finalExamDate: editingItem.finalExamDate,
                assessmentType: editingItem.assessmentType,
              }
            : emptyPayload
        }
        academicYears={academicYears}
      />
      <DeleteDialog
        open={Boolean(deleteCandidate)}
        onClose={() => setDeleteCandidate(null)}
        onConfirm={performDelete}
        isDeleting={isSaving}
      />
      <div className="space-y-6">
        <section className={cardClassName}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="size-5 text-primary" />
              <Typography as="h2" variant="h3">
                {t("title")}
              </Typography>
            </div>
            <Button type="button" size="sm" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="size-4" />
              {t("newSemester")}
            </Button>
          </div>
          <Typography variant="muted">{t("description")}</Typography>
        </section>
        <section className={cardClassName}>
          <Typography as="h3" variant="h4" className="mb-4">
            {t("existingSemesters")}
          </Typography>
          {isLoading ? (
            <DashboardPanelSkeleton />
          ) : (
            <DynamicTable
              data={sortedSemesters}
              columns={columns}
              getRowKey={(row) => row.id}
              emptyMessage={t("emptyState")}
            />
          )}
        </section>
      </div>
    </>
  );
}
