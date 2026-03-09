"use client";

import { CalendarRange, PencilLine, Plus, Save, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DashboardPanelSkeleton } from "@/components/dashboard/loading-skeletons";
import { DynamicTable, type DynamicTableColumn } from "@/components/ui/dynamic-table";
import { Typography } from "@/components/ui/typography";
import {
  academicYearPayloadSchema,
  type AcademicYearInput,
  type AcademicYearPayloadInput,
} from "@/lib/validations/academic-year";
import { type SemesterInput } from "@/lib/validations/semester";

const fieldClassName =
  "h-11 w-full rounded-xl border border-input bg-background/80 px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";

const cardClassName = "rounded-2xl border border-border bg-card/80 p-5 shadow-xs sm:p-6";

const emptyPayload: AcademicYearPayloadInput = {
  name: "",
  startDate: "",
  endDate: "",
  enrollmentStartDate: "",
  enrollmentEndDate: "",
  allowGradeEditAfterEnd: false,
  allowStudentFileEditAfterEnd: false,
  numberOfSemesters: 2,
  isActive: false,
};

function sortAcademicYears(data: AcademicYearInput[]) {
  return [...data].sort((a, b) => {
    if (a.isActive && !b.isActive) {
      return -1;
    }
    if (!a.isActive && b.isActive) {
      return 1;
    }
    return b.startDate.localeCompare(a.startDate);
  });
}

type AcademicYearDialogProps = {
  open: boolean;
  title: string;
  submitLabel: string;
  onClose: () => void;
  onSubmit: (values: AcademicYearPayloadInput) => Promise<void>;
  isSaving: boolean;
  initialValues: AcademicYearPayloadInput;
};

type ConfirmDeleteDialogProps = {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
};

function ConfirmDeleteDialog({
  open,
  title,
  message,
  onClose,
  onConfirm,
  isDeleting,
}: ConfirmDeleteDialogProps) {
  const t = useTranslations("AcademicYear");

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Typography as="h3" variant="h3">
            {title}
          </Typography>
          <Button type="button" variant="ghost" size="icon-sm" onClick={onClose} aria-label={t("closeDialog")}>
            <X className="size-4" />
          </Button>
        </div>
        <Typography variant="muted" className="mb-5">
          {message}
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

function AcademicYearDialog({
  open,
  title,
  submitLabel,
  onClose,
  onSubmit,
  isSaving,
  initialValues,
}: AcademicYearDialogProps) {
  const t = useTranslations("AcademicYear");
  const {
    register,
    setError,
    clearErrors,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AcademicYearPayloadInput>({
    defaultValues: initialValues,
  });

  useEffect(() => {
    if (open) {
      reset(initialValues);
    }
  }, [initialValues, open, reset]);

  async function handleSave(values: AcademicYearPayloadInput) {
    const parsed = academicYearPayloadSchema.safeParse(values);

    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        setError(issue.path.join(".") as never, { message: t("validation.invalidField") });
      });
      toast.error(t("validation.checkRequiredFields"));
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
            <div className="space-y-2 md:col-span-2">
              <Typography as="label" variant="label" htmlFor="name">
                {t("fields.name")}
              </Typography>
              <input id="name" className={fieldClassName} {...register("name", { onChange: () => clearErrors("name") })} />
              {errors.name ? <Typography variant="error">{errors.name.message}</Typography> : null}
            </div>

            <div className="space-y-2">
              <Typography as="label" variant="label" htmlFor="startDate">
                {t("fields.startDate")}
              </Typography>
              <input
                id="startDate"
                type="date"
                className={fieldClassName}
                {...register("startDate", { onChange: () => clearErrors("startDate") })}
              />
              {errors.startDate ? <Typography variant="error">{errors.startDate.message}</Typography> : null}
            </div>

            <div className="space-y-2">
              <Typography as="label" variant="label" htmlFor="endDate">
                {t("fields.endDate")}
              </Typography>
              <input
                id="endDate"
                type="date"
                className={fieldClassName}
                {...register("endDate", { onChange: () => clearErrors("endDate") })}
              />
              {errors.endDate ? <Typography variant="error">{errors.endDate.message}</Typography> : null}
            </div>

            <div className="space-y-2">
              <Typography as="label" variant="label" htmlFor="enrollmentStartDate">
                {t("fields.enrollmentStartDate")}
              </Typography>
              <input
                id="enrollmentStartDate"
                type="date"
                className={fieldClassName}
                {...register("enrollmentStartDate", { onChange: () => clearErrors("enrollmentStartDate") })}
              />
              {errors.enrollmentStartDate ? <Typography variant="error">{errors.enrollmentStartDate.message}</Typography> : null}
            </div>

            <div className="space-y-2">
              <Typography as="label" variant="label" htmlFor="enrollmentEndDate">
                {t("fields.enrollmentEndDate")}
              </Typography>
              <input
                id="enrollmentEndDate"
                type="date"
                className={fieldClassName}
                {...register("enrollmentEndDate", { onChange: () => clearErrors("enrollmentEndDate") })}
              />
              {errors.enrollmentEndDate ? <Typography variant="error">{errors.enrollmentEndDate.message}</Typography> : null}
            </div>

            <div className="space-y-2">
              <Typography as="label" variant="label" htmlFor="numberOfSemesters">
                {t("fields.numberOfSemesters")}
              </Typography>
              <input
                id="numberOfSemesters"
                type="number"
                min={1}
                className={fieldClassName}
                {...register("numberOfSemesters", {
                  valueAsNumber: true,
                  onChange: () => clearErrors("numberOfSemesters"),
                })}
              />
              {errors.numberOfSemesters ? <Typography variant="error">{errors.numberOfSemesters.message}</Typography> : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <label className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-foreground">
              <input type="checkbox" className="size-4 accent-primary" {...register("allowGradeEditAfterEnd")} />
              {t("fields.allowGradeEditAfterEnd")}
            </label>

            <label className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-foreground">
              <input type="checkbox" className="size-4 accent-primary" {...register("allowStudentFileEditAfterEnd")} />
              {t("fields.allowStudentFileEditAfterEnd")}
            </label>

            <label className="inline-flex items-start gap-2 rounded-xl border border-border px-3 py-2 text-sm text-foreground">
              <input type="checkbox" className="mt-0.5 size-4 accent-primary" {...register("isActive")} />
              <span className="space-y-1">
                <span className="block font-medium">{t("fields.isActive")}</span>
                <span className="block text-xs text-muted-foreground">{t("activeHelpText")}</span>
              </span>
            </label>
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

export function AcademicYearForm() {
  const t = useTranslations("AcademicYear");
  const semesterTypes = useTranslations("Semesters.assessmentTypes");
  const [academicYears, setAcademicYears] = useState<AcademicYearInput[]>([]);
  const [semesters, setSemesters] = useState<SemesterInput[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AcademicYearInput | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<AcademicYearInput | null>(null);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState("");

  const sortedAcademicYears = useMemo(() => sortAcademicYears(academicYears), [academicYears]);

  const semestersByAcademicYearId = useMemo(
    () =>
      semesters.reduce<Record<string, SemesterInput[]>>((acc, semester) => {
        if (!acc[semester.academicYearId]) {
          acc[semester.academicYearId] = [];
        }
        acc[semester.academicYearId].push(semester);
        return acc;
      }, {}),
    [semesters],
  );

  const selectedAcademicYear = useMemo(
    () => sortedAcademicYears.find((item) => item.id === selectedAcademicYearId) ?? null,
    [selectedAcademicYearId, sortedAcademicYears],
  );

  const selectedAcademicYearSemesters = useMemo(() => {
    if (!selectedAcademicYear) {
      return [];
    }
    return [...(semestersByAcademicYearId[selectedAcademicYear.id] ?? [])].sort((a, b) =>
      a.semesterStartDate.localeCompare(b.semesterStartDate),
    );
  }, [selectedAcademicYear, semestersByAcademicYearId]);

  useEffect(() => {
    let isMounted = true;

    async function loadAcademicYears() {
      try {
        const [academicYearsResponse, semestersResponse] = await Promise.all([
          fetch("/api/academic-years"),
          fetch("/api/semesters"),
        ]);
        if (!academicYearsResponse.ok || !semestersResponse.ok) {
          throw new Error("Failed to load academic years.");
        }

        const academicYearsData = (await academicYearsResponse.json()) as AcademicYearInput[];
        const semestersData = (await semestersResponse.json()) as SemesterInput[];
        if (isMounted) {
          setAcademicYears(academicYearsData);
          setSemesters(semestersData);
          const defaultAcademicYear = sortAcademicYears(academicYearsData)[0];
          setSelectedAcademicYearId(defaultAcademicYear?.id ?? "");
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

    void loadAcademicYears();

    return () => {
      isMounted = false;
    };
  }, [t]);

  async function handleCreate(values: AcademicYearPayloadInput) {
    setIsSaving(true);
    try {
      const response = await fetch("/api/academic-years", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Failed to save academic year.");
      }

      const updated = (await response.json()) as AcademicYearInput[];
      setAcademicYears(updated);
      if (!selectedAcademicYearId) {
        const defaultAcademicYear = sortAcademicYears(updated)[0];
        setSelectedAcademicYearId(defaultAcademicYear?.id ?? "");
      }
      setIsCreateDialogOpen(false);
      toast.success(t("saved"));
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdate(values: AcademicYearPayloadInput) {
    if (!editingItem) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/academic-years", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...values, id: editingItem.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to update academic year.");
      }

      const updated = (await response.json()) as AcademicYearInput[];
      setAcademicYears(updated);
      setSelectedAcademicYearId(editingItem.id);
      setEditingItem(null);
      toast.success(t("saved"));
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setIsSaving(false);
    }
  }

  const performDelete = useCallback(async () => {
    if (!deleteCandidate) {
      return;
    }
    try {
      setIsSaving(true);
      const response = await fetch(`/api/academic-years?id=${encodeURIComponent(deleteCandidate.id)}`, {
        method: "DELETE",
      });

      if (response.status === 409) {
        toast.error(t("deleteBlockedByActiveStudent"));
        setDeleteCandidate(null);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to delete academic year.");
      }

      const updated = (await response.json()) as AcademicYearInput[];
      setAcademicYears(updated);
      if (editingItem?.id === deleteCandidate.id) {
        setEditingItem(null);
      }
      if (selectedAcademicYearId === deleteCandidate.id) {
        const defaultAcademicYear = sortAcademicYears(updated)[0];
        setSelectedAcademicYearId(defaultAcademicYear?.id ?? "");
      }
      setDeleteCandidate(null);
      toast.success(t("deleted"));
    } catch {
      toast.error(t("deleteFailed"));
    } finally {
      setIsSaving(false);
    }
  }, [deleteCandidate, editingItem?.id, selectedAcademicYearId, t]);

  const requestDelete = useCallback(
    (item: AcademicYearInput) => {
      if (item.hasActiveStudentRecord) {
        toast.error(t("deleteBlockedByActiveStudent"));
        return;
      }
      setDeleteCandidate(item);
    },
    [t],
  );

  const columns = useMemo<DynamicTableColumn<AcademicYearInput>[]>(
    () => [
      {
        key: "name",
        header: t("table.name"),
        render: (row) => row.name,
      },
      {
        key: "startDate",
        header: t("table.startDate"),
        render: (row) => row.startDate,
      },
      {
        key: "endDate",
        header: t("table.endDate"),
        render: (row) => row.endDate,
      },
      {
        key: "enrollmentWindow",
        header: t("table.enrollmentWindow"),
        render: (row) => `${row.enrollmentStartDate} - ${row.enrollmentEndDate}`,
      },
      {
        key: "numberOfSemesters",
        header: t("table.numberOfSemesters"),
        render: (row) => row.numberOfSemesters,
      },
      {
        key: "isActive",
        header: t("table.isActive"),
        render: (row) => (row.isActive ? t("yes") : t("no")),
      },
      {
        key: "studentLink",
        header: t("table.activeStudentLink"),
        render: (row) => (row.hasActiveStudentRecord ? t("yes") : t("no")),
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
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => requestDelete(row)}
              title={row.hasActiveStudentRecord ? t("deleteBlockedByActiveStudent") : undefined}
            >
              <Trash2 className="size-4" />
              {t("delete")}
            </Button>
          </div>
        ),
      },
    ],
    [requestDelete, t],
  );

  return (
    <>
      <AcademicYearDialog
        open={isCreateDialogOpen}
        title={t("dialogs.addTitle")}
        submitLabel={t("create")}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreate}
        isSaving={isSaving}
        initialValues={emptyPayload}
      />
      <ConfirmDeleteDialog
        open={Boolean(deleteCandidate)}
        title={t("dialogs.deleteTitle")}
        message={t("deleteConfirm")}
        onClose={() => setDeleteCandidate(null)}
        onConfirm={performDelete}
        isDeleting={isSaving}
      />
      <AcademicYearDialog
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
                startDate: editingItem.startDate,
                endDate: editingItem.endDate,
                enrollmentStartDate: editingItem.enrollmentStartDate,
                enrollmentEndDate: editingItem.enrollmentEndDate,
                allowGradeEditAfterEnd: editingItem.allowGradeEditAfterEnd,
                allowStudentFileEditAfterEnd: editingItem.allowStudentFileEditAfterEnd,
                numberOfSemesters: editingItem.numberOfSemesters,
                isActive: editingItem.isActive,
              }
            : emptyPayload
        }
      />
      <div className="space-y-6">
        <section className={cardClassName}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CalendarRange className="size-5 text-primary" />
              <Typography as="h2" variant="h3">
                {t("title")}
              </Typography>
            </div>
            <Button type="button" size="sm" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="size-4" />
              {t("newAcademicYear")}
            </Button>
          </div>
          <Typography variant="muted">{t("activeHelpText")}</Typography>
        </section>
      <section className={cardClassName}>
        <div className="mb-4 flex items-center justify-between">
          <Typography as="h3" variant="h4">
            {t("existingAcademicYears")}
          </Typography>
        </div>

        {isLoading ? (
          <DashboardPanelSkeleton />
        ) : (
          <DynamicTable
            data={sortedAcademicYears}
            columns={columns}
            getRowKey={(row) => row.id}
            emptyMessage={t("emptyState")}
          />
        )}
        </section>

        <section className={cardClassName}>
          <Typography as="h3" variant="h4" className="mb-2">
            {t("hierarchy.title")}
          </Typography>
          <Typography variant="muted" className="mb-4">
            {t("hierarchy.description")}
          </Typography>

          <div className="mb-4 max-w-md space-y-2">
            <Typography as="label" variant="label" htmlFor="hierarchyAcademicYear">
              {t("hierarchy.selectAcademicYear")}
            </Typography>
            <select
              id="hierarchyAcademicYear"
              className={fieldClassName}
              value={selectedAcademicYearId}
              onChange={(event) => setSelectedAcademicYearId(event.target.value)}
            >
              {sortedAcademicYears.map((academicYear) => (
                <option key={academicYear.id} value={academicYear.id}>
                  {academicYear.name}
                </option>
              ))}
            </select>
          </div>

          {!selectedAcademicYear ? (
            <Typography variant="muted">{t("hierarchy.noSelection")}</Typography>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-border/70 p-3">
                  <Typography variant="caption" className="text-muted-foreground">
                    {t("hierarchy.status")}
                  </Typography>
                  <Typography variant="body" className="mt-1 font-medium">
                    {selectedAcademicYear.isActive ? t("yes") : t("no")}
                  </Typography>
                </div>
                <div className="rounded-xl border border-border/70 p-3">
                  <Typography variant="caption" className="text-muted-foreground">
                    {t("hierarchy.expectedSemesters")}
                  </Typography>
                  <Typography variant="body" className="mt-1 font-medium">
                    {selectedAcademicYear.numberOfSemesters}
                  </Typography>
                </div>
                <div className="rounded-xl border border-border/70 p-3">
                  <Typography variant="caption" className="text-muted-foreground">
                    {t("hierarchy.configuredSemesters")}
                  </Typography>
                  <Typography variant="body" className="mt-1 font-medium">
                    {selectedAcademicYearSemesters.length}
                  </Typography>
                </div>
                <div className="rounded-xl border border-border/70 p-3">
                  <Typography variant="caption" className="text-muted-foreground">
                    {t("hierarchy.enrollmentWindow")}
                  </Typography>
                  <Typography variant="body" className="mt-1 font-medium">
                    {selectedAcademicYear.enrollmentStartDate} - {selectedAcademicYear.enrollmentEndDate}
                  </Typography>
                </div>
              </div>

              <div className="rounded-xl border border-border/70 p-4">
                <Typography variant="label" className="mb-3 block">
                  {t("hierarchy.structureTitle")}
                </Typography>
                <div className="space-y-3">
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                    <Typography variant="body" className="font-medium">
                      {selectedAcademicYear.name}
                    </Typography>
                    <Typography variant="caption" className="text-muted-foreground">
                      {selectedAcademicYear.startDate} - {selectedAcademicYear.endDate}
                    </Typography>
                  </div>

                  {selectedAcademicYearSemesters.length === 0 ? (
                    <Typography variant="muted">{t("hierarchy.noSemestersLinked")}</Typography>
                  ) : (
                    <div className="space-y-3 border-border ltr:border-l-2 rtl:border-r-2 ltr:pl-4 rtl:pr-4">
                      {selectedAcademicYearSemesters.map((semester) => (
                        <div key={semester.id} className="rounded-lg border border-border/70 p-3">
                          <Typography variant="body" className="font-medium">
                            {semester.name}
                          </Typography>
                          <Typography variant="caption" className="mt-1 block text-muted-foreground">
                            {t("hierarchy.semesterDates")}: {semester.semesterStartDate} - {semester.semesterEndDate}
                          </Typography>
                          <Typography variant="caption" className="block text-muted-foreground">
                            {t("hierarchy.classesDates")}: {semester.classesStartDate} - {semester.classesEndDate}
                          </Typography>
                          <Typography variant="caption" className="block text-muted-foreground">
                            {t("hierarchy.finalExamDate")}: {semester.finalExamDate}
                          </Typography>
                          <Typography variant="caption" className="block text-muted-foreground">
                            {t("hierarchy.assessmentType")}: {semesterTypes(semester.assessmentType)}
                          </Typography>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
