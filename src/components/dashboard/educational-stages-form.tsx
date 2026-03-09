"use client";

import { GraduationCap, PencilLine, Plus, Save, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DashboardPanelSkeleton } from "@/components/dashboard/loading-skeletons";
import { DynamicTable, type DynamicTableColumn } from "@/components/ui/dynamic-table";
import { Typography } from "@/components/ui/typography";
import {
  educationalStagePayloadSchema,
  type EducationalStageInput,
  type EducationalStagePayloadInput,
} from "@/lib/validations/educational-stage";

const fieldClassName =
  "h-11 w-full rounded-xl border border-input bg-background/80 px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";
const cardClassName = "rounded-2xl border border-border bg-card/80 p-5 shadow-xs sm:p-6";

const emptyPayload: EducationalStagePayloadInput = {
  name: "",
  minimumStudentAge: 6,
  teachingLanguage: "",
  isMixedStage: false,
};

type EducationalStageDialogProps = {
  open: boolean;
  title: string;
  submitLabel: string;
  onClose: () => void;
  onSubmit: (values: EducationalStagePayloadInput) => Promise<void>;
  isSaving: boolean;
  initialValues: EducationalStagePayloadInput;
};

function EducationalStageDialog({
  open,
  title,
  submitLabel,
  onClose,
  onSubmit,
  isSaving,
  initialValues,
}: EducationalStageDialogProps) {
  const t = useTranslations("EducationalStages");
  const validation = useTranslations("EducationalStages.validation");
  const {
    register,
    setError,
    clearErrors,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EducationalStagePayloadInput>({
    defaultValues: initialValues,
  });

  useEffect(() => {
    if (open) {
      reset(initialValues);
    }
  }, [initialValues, open, reset]);

  async function handleSave(values: EducationalStagePayloadInput) {
    const parsed = educationalStagePayloadSchema.safeParse(values);

    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const message =
          issue.message === "nameTooShort"
            ? validation("nameTooShort")
            : issue.message === "minimumAgeInvalid"
              ? validation("minimumAgeInvalid")
              : issue.message === "teachingLanguageTooShort"
                ? validation("teachingLanguageTooShort")
                : validation("invalidField");
        setError(issue.path.join(".") as never, { message });
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
              <Typography as="label" variant="label" htmlFor="minimumStudentAge">
                {t("fields.minimumStudentAge")}
              </Typography>
              <input
                id="minimumStudentAge"
                type="number"
                min={3}
                className={fieldClassName}
                {...register("minimumStudentAge", { valueAsNumber: true, onChange: () => clearErrors("minimumStudentAge") })}
              />
              {errors.minimumStudentAge ? <Typography variant="error">{errors.minimumStudentAge.message}</Typography> : null}
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

          <label className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-foreground">
            <input type="checkbox" className="size-4 accent-primary" {...register("isMixedStage")} />
            {t("fields.isMixedStage")}
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
  const t = useTranslations("EducationalStages");

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

export function EducationalStagesForm() {
  const t = useTranslations("EducationalStages");
  const [stages, setStages] = useState<EducationalStageInput[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EducationalStageInput | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<EducationalStageInput | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadStages() {
      try {
        const response = await fetch("/api/educational-stages");
        if (!response.ok) {
          throw new Error("Failed to load educational stages.");
        }

        const data = (await response.json()) as EducationalStageInput[];
        if (isMounted) {
          setStages(data);
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

    void loadStages();

    return () => {
      isMounted = false;
    };
  }, [t]);

  async function handleCreate(values: EducationalStagePayloadInput) {
    setIsSaving(true);
    try {
      const response = await fetch("/api/educational-stages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        throw new Error("Failed to create stage.");
      }
      const updated = (await response.json()) as EducationalStageInput[];
      setStages(updated);
      setIsCreateDialogOpen(false);
      toast.success(t("saved"));
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdate(values: EducationalStagePayloadInput) {
    if (!editingItem) {
      return;
    }
    setIsSaving(true);
    try {
      const response = await fetch("/api/educational-stages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, id: editingItem.id }),
      });
      if (!response.ok) {
        throw new Error("Failed to update stage.");
      }
      const updated = (await response.json()) as EducationalStageInput[];
      setStages(updated);
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
      const response = await fetch(`/api/educational-stages?id=${encodeURIComponent(deleteCandidate.id)}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete stage.");
      }
      const updated = (await response.json()) as EducationalStageInput[];
      setStages(updated);
      setDeleteCandidate(null);
      toast.success(t("deleted"));
    } catch {
      toast.error(t("deleteFailed"));
    } finally {
      setIsSaving(false);
    }
  }

  const columns = useMemo<DynamicTableColumn<EducationalStageInput>[]>(
    () => [
      {
        key: "name",
        header: t("table.name"),
        render: (row) => row.name,
      },
      {
        key: "minimumStudentAge",
        header: t("table.minimumStudentAge"),
        render: (row) => row.minimumStudentAge,
      },
      {
        key: "teachingLanguage",
        header: t("table.teachingLanguage"),
        render: (row) => row.teachingLanguage,
      },
      {
        key: "isMixedStage",
        header: t("table.isMixedStage"),
        render: (row) => (row.isMixedStage ? t("yes") : t("no")),
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
    [t],
  );

  return (
    <>
      <EducationalStageDialog
        open={isCreateDialogOpen}
        title={t("dialogs.addTitle")}
        submitLabel={t("create")}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreate}
        isSaving={isSaving}
        initialValues={emptyPayload}
      />
      <EducationalStageDialog
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
                minimumStudentAge: editingItem.minimumStudentAge,
                teachingLanguage: editingItem.teachingLanguage,
                isMixedStage: editingItem.isMixedStage,
              }
            : emptyPayload
        }
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
              <GraduationCap className="size-5 text-primary" />
              <Typography as="h2" variant="h3">
                {t("title")}
              </Typography>
            </div>
            <Button type="button" size="sm" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="size-4" />
              {t("newStage")}
            </Button>
          </div>
          <Typography variant="muted">{t("description")}</Typography>
        </section>

        <section className={cardClassName}>
          <Typography as="h3" variant="h4" className="mb-4">
            {t("existingStages")}
          </Typography>
          {isLoading ? (
            <DashboardPanelSkeleton />
          ) : (
            <DynamicTable data={stages} columns={columns} getRowKey={(row) => row.id} emptyMessage={t("emptyState")} />
          )}
        </section>
      </div>
    </>
  );
}
