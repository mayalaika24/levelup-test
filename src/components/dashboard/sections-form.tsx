"use client";

import { Layers3, PencilLine, Plus, Save, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DashboardPanelSkeleton } from "@/components/dashboard/loading-skeletons";
import { DynamicTable, type DynamicTableColumn } from "@/components/ui/dynamic-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import { type GradeInput } from "@/lib/validations/grade";
import { sectionPayloadSchema, type SectionInput, type SectionPayloadInput } from "@/lib/validations/section";

type UserInput = {
  id: string;
  name: string;
  role: string;
};

const fieldClassName =
  "h-11 w-full rounded-xl border border-input bg-background/80 px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";
const selectTriggerClassName =
  "h-11 w-full rounded-xl border-input bg-background/80 px-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/30";
const cardClassName = "rounded-2xl border border-border bg-card/80 p-5 shadow-xs sm:p-6";

const emptyPayload: SectionPayloadInput = {
  name: "",
  gradeId: "",
  defaultCapacity: 30,
  supervisorUserId: "",
};

type SectionDialogProps = {
  open: boolean;
  title: string;
  submitLabel: string;
  onClose: () => void;
  onSubmit: (values: SectionPayloadInput) => Promise<void>;
  isSaving: boolean;
  initialValues: SectionPayloadInput;
  grades: GradeInput[];
  users: UserInput[];
};

function SectionDialog({ open, title, submitLabel, onClose, onSubmit, isSaving, initialValues, grades, users }: SectionDialogProps) {
  const t = useTranslations("Sections");
  const validation = useTranslations("Sections.validation");
  const {
    register,
    control,
    setError,
    clearErrors,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SectionPayloadInput>({
    defaultValues: initialValues,
  });

  useEffect(() => {
    if (open) {
      reset(initialValues);
    }
  }, [initialValues, open, reset]);

  async function handleSave(values: SectionPayloadInput) {
    const parsed = sectionPayloadSchema.safeParse(values);

    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const key = issue.message;
        const message =
          key === "nameTooShort"
            ? validation("nameTooShort")
            : key === "gradeRequired"
              ? validation("gradeRequired")
              : key === "defaultCapacityInvalid"
                ? validation("defaultCapacityInvalid")
                : key === "supervisorRequired"
                  ? validation("supervisorRequired")
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
              <Typography as="label" variant="label" htmlFor="gradeId">
                {t("fields.grade")}
              </Typography>
              <Controller
                name="gradeId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      clearErrors("gradeId");
                      field.onChange(value);
                    }}
                  >
                    <SelectTrigger id="gradeId" className={selectTriggerClassName}>
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
              {errors.gradeId ? <Typography variant="error">{errors.gradeId.message}</Typography> : null}
            </div>

            <div className="space-y-2">
              <Typography as="label" variant="label" htmlFor="defaultCapacity">
                {t("fields.defaultCapacity")}
              </Typography>
              <input
                id="defaultCapacity"
                type="number"
                min={1}
                max={200}
                className={fieldClassName}
                {...register("defaultCapacity", { valueAsNumber: true, onChange: () => clearErrors("defaultCapacity") })}
              />
              {errors.defaultCapacity ? <Typography variant="error">{errors.defaultCapacity.message}</Typography> : null}
            </div>

            <div className="space-y-2">
              <Typography as="label" variant="label" htmlFor="supervisorUserId">
                {t("fields.supervisor")}
              </Typography>
              <Controller
                name="supervisorUserId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      clearErrors("supervisorUserId");
                      field.onChange(value);
                    }}
                  >
                    <SelectTrigger id="supervisorUserId" className={selectTriggerClassName}>
                      <SelectValue placeholder={t("fields.selectSupervisor")} />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.supervisorUserId ? <Typography variant="error">{errors.supervisorUserId.message}</Typography> : null}
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
  const t = useTranslations("Sections");

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

export function SectionsForm() {
  const t = useTranslations("Sections");
  const [sections, setSections] = useState<SectionInput[]>([]);
  const [grades, setGrades] = useState<GradeInput[]>([]);
  const [users, setUsers] = useState<UserInput[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SectionInput | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<SectionInput | null>(null);

  const gradeNameById = useMemo(
    () =>
      grades.reduce<Record<string, string>>((acc, grade) => {
        acc[grade.id] = grade.name;
        return acc;
      }, {}),
    [grades],
  );

  const userNameById = useMemo(
    () =>
      users.reduce<Record<string, string>>((acc, user) => {
        acc[user.id] = user.name;
        return acc;
      }, {}),
    [users],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [sectionsResponse, gradesResponse, usersResponse] = await Promise.all([
          fetch("/api/sections"),
          fetch("/api/grades"),
          fetch("/api/users"),
        ]);

        if (!sectionsResponse.ok || !gradesResponse.ok || !usersResponse.ok) {
          throw new Error("Failed to load sections data.");
        }

        const sectionsData = (await sectionsResponse.json()) as SectionInput[];
        const gradesData = (await gradesResponse.json()) as GradeInput[];
        const usersData = (await usersResponse.json()) as UserInput[];

        if (isMounted) {
          setSections(sectionsData);
          setGrades(gradesData);
          setUsers(usersData);
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

  async function handleCreate(values: SectionPayloadInput) {
    setIsSaving(true);
    try {
      const response = await fetch("/api/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Failed to create section.");
      }

      const updated = (await response.json()) as SectionInput[];
      setSections(updated);
      setIsCreateDialogOpen(false);
      toast.success(t("saved"));
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdate(values: SectionPayloadInput) {
    if (!editingItem) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/sections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, id: editingItem.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to update section.");
      }

      const updated = (await response.json()) as SectionInput[];
      setSections(updated);
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
      const response = await fetch(`/api/sections?id=${encodeURIComponent(deleteCandidate.id)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete section.");
      }

      const updated = (await response.json()) as SectionInput[];
      setSections(updated);
      setDeleteCandidate(null);
      toast.success(t("deleted"));
    } catch {
      toast.error(t("deleteFailed"));
    } finally {
      setIsSaving(false);
    }
  }

  const columns = useMemo<DynamicTableColumn<SectionInput>[]>(
    () => [
      {
        key: "name",
        header: t("table.name"),
        render: (row) => row.name,
      },
      {
        key: "grade",
        header: t("table.grade"),
        render: (row) => gradeNameById[row.gradeId] ?? "-",
      },
      {
        key: "defaultCapacity",
        header: t("table.defaultCapacity"),
        render: (row) => row.defaultCapacity,
      },
      {
        key: "supervisor",
        header: t("table.supervisor"),
        render: (row) => userNameById[row.supervisorUserId] ?? "-",
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
    [gradeNameById, t, userNameById],
  );

  return (
    <>
      <SectionDialog
        key="create-section-dialog"
        open={isCreateDialogOpen}
        title={t("dialogs.addTitle")}
        submitLabel={t("create")}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreate}
        isSaving={isSaving}
        initialValues={emptyPayload}
        grades={grades}
        users={users}
      />
      <SectionDialog
        key={`edit-section-dialog-${editingItem?.id ?? "none"}`}
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
                gradeId: editingItem.gradeId,
                defaultCapacity: editingItem.defaultCapacity,
                supervisorUserId: editingItem.supervisorUserId,
              }
            : emptyPayload
        }
        grades={grades}
        users={users}
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
              <Layers3 className="size-5 text-primary" />
              <Typography as="h2" variant="h3">
                {t("title")}
              </Typography>
            </div>
            <Button type="button" size="sm" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="size-4" />
              {t("newSection")}
            </Button>
          </div>
          <Typography variant="muted">{t("description")}</Typography>
        </section>

        <section className={cardClassName}>
          <Typography as="h3" variant="h4" className="mb-4">
            {t("existingSections")}
          </Typography>
          {isLoading ? (
            <DashboardPanelSkeleton />
          ) : (
            <DynamicTable data={sections} columns={columns} getRowKey={(row) => row.id} emptyMessage={t("emptyState")} />
          )}
        </section>
      </div>
    </>
  );
}
