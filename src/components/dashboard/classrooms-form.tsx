"use client";

import { Building, PencilLine, Plus, Save, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DashboardPanelSkeleton } from "@/components/dashboard/loading-skeletons";
import { DynamicTable, type DynamicTableColumn } from "@/components/ui/dynamic-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import { classroomPayloadSchema, type ClassroomInput, type ClassroomPayloadInput } from "@/lib/validations/classroom";

const fieldClassName =
  "h-11 w-full rounded-xl border border-input bg-background/80 px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";
const selectTriggerClassName =
  "h-11 w-full rounded-xl border-input bg-background/80 px-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/30";
const cardClassName = "rounded-2xl border border-border bg-card/80 p-5 shadow-xs sm:p-6";

const emptyPayload: ClassroomPayloadInput = {
  name: "",
  roomNumber: "",
  capacity: 30,
  type: "teaching",
  buildingName: "",
  floorNumber: "",
};

type ClassroomDialogProps = {
  open: boolean;
  title: string;
  submitLabel: string;
  onClose: () => void;
  onSubmit: (values: ClassroomPayloadInput) => Promise<void>;
  isSaving: boolean;
  initialValues: ClassroomPayloadInput;
};

function ClassroomDialog({ open, title, submitLabel, onClose, onSubmit, isSaving, initialValues }: ClassroomDialogProps) {
  const t = useTranslations("Classrooms");
  const validation = useTranslations("Classrooms.validation");
  const {
    register,
    control,
    setError,
    clearErrors,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClassroomPayloadInput>({
    defaultValues: initialValues,
  });

  useEffect(() => {
    if (open) {
      reset(initialValues);
    }
  }, [initialValues, open, reset]);

  async function handleSave(values: ClassroomPayloadInput) {
    const parsed = classroomPayloadSchema.safeParse(values);

    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const key = issue.message;
        const message =
          key === "nameTooShort"
            ? validation("nameTooShort")
            : key === "roomNumberRequired"
              ? validation("roomNumberRequired")
              : key === "capacityInvalid"
                ? validation("capacityInvalid")
                : key === "buildingNameTooShort"
                  ? validation("buildingNameTooShort")
                  : key === "floorNumberRequired"
                    ? validation("floorNumberRequired")
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
              <Typography as="label" variant="label" htmlFor="roomNumber">
                {t("fields.roomNumber")}
              </Typography>
              <input
                id="roomNumber"
                className={fieldClassName}
                {...register("roomNumber", { onChange: () => clearErrors("roomNumber") })}
              />
              {errors.roomNumber ? <Typography variant="error">{errors.roomNumber.message}</Typography> : null}
            </div>

            <div className="space-y-2">
              <Typography as="label" variant="label" htmlFor="capacity">
                {t("fields.capacity")}
              </Typography>
              <input
                id="capacity"
                type="number"
                min={1}
                max={500}
                className={fieldClassName}
                {...register("capacity", { valueAsNumber: true, onChange: () => clearErrors("capacity") })}
              />
              {errors.capacity ? <Typography variant="error">{errors.capacity.message}</Typography> : null}
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
                    <SelectTrigger id="type" className={selectTriggerClassName}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teaching">{t("types.teaching")}</SelectItem>
                      <SelectItem value="lab">{t("types.lab")}</SelectItem>
                      <SelectItem value="computer">{t("types.computer")}</SelectItem>
                      <SelectItem value="theater">{t("types.theater")}</SelectItem>
                      <SelectItem value="sports">{t("types.sports")}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Typography as="label" variant="label" htmlFor="buildingName">
                {t("fields.buildingName")}
              </Typography>
              <input
                id="buildingName"
                className={fieldClassName}
                {...register("buildingName", { onChange: () => clearErrors("buildingName") })}
              />
              {errors.buildingName ? <Typography variant="error">{errors.buildingName.message}</Typography> : null}
            </div>

            <div className="space-y-2">
              <Typography as="label" variant="label" htmlFor="floorNumber">
                {t("fields.floorNumber")}
              </Typography>
              <input
                id="floorNumber"
                className={fieldClassName}
                {...register("floorNumber", { onChange: () => clearErrors("floorNumber") })}
              />
              {errors.floorNumber ? <Typography variant="error">{errors.floorNumber.message}</Typography> : null}
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
  const t = useTranslations("Classrooms");

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

export function ClassroomsForm() {
  const t = useTranslations("Classrooms");
  const [classrooms, setClassrooms] = useState<ClassroomInput[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ClassroomInput | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<ClassroomInput | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadClassrooms() {
      try {
        const response = await fetch("/api/classrooms");
        if (!response.ok) {
          throw new Error("Failed to load classrooms.");
        }

        const data = (await response.json()) as ClassroomInput[];
        if (isMounted) {
          setClassrooms(data);
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

    void loadClassrooms();

    return () => {
      isMounted = false;
    };
  }, [t]);

  async function handleCreate(values: ClassroomPayloadInput) {
    setIsSaving(true);
    try {
      const response = await fetch("/api/classrooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        throw new Error("Failed to create classroom.");
      }
      const updated = (await response.json()) as ClassroomInput[];
      setClassrooms(updated);
      setIsCreateDialogOpen(false);
      toast.success(t("saved"));
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdate(values: ClassroomPayloadInput) {
    if (!editingItem) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/classrooms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, id: editingItem.id }),
      });
      if (!response.ok) {
        throw new Error("Failed to update classroom.");
      }
      const updated = (await response.json()) as ClassroomInput[];
      setClassrooms(updated);
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
      const response = await fetch(`/api/classrooms?id=${encodeURIComponent(deleteCandidate.id)}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Failed to delete classroom.");
      }
      const updated = (await response.json()) as ClassroomInput[];
      setClassrooms(updated);
      setDeleteCandidate(null);
      toast.success(t("deleted"));
    } catch {
      toast.error(t("deleteFailed"));
    } finally {
      setIsSaving(false);
    }
  }

  const columns = useMemo<DynamicTableColumn<ClassroomInput>[]>(
    () => [
      { key: "name", header: t("table.name"), render: (row) => row.name },
      { key: "roomNumber", header: t("table.roomNumber"), render: (row) => row.roomNumber },
      { key: "capacity", header: t("table.capacity"), render: (row) => row.capacity },
      { key: "type", header: t("table.type"), render: (row) => t(`types.${row.type}`) },
      { key: "buildingName", header: t("table.buildingName"), render: (row) => row.buildingName },
      { key: "floorNumber", header: t("table.floorNumber"), render: (row) => row.floorNumber },
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
      <ClassroomDialog
        key="create-classroom-dialog"
        open={isCreateDialogOpen}
        title={t("dialogs.addTitle")}
        submitLabel={t("create")}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreate}
        isSaving={isSaving}
        initialValues={emptyPayload}
      />
      <ClassroomDialog
        key={`edit-classroom-dialog-${editingItem?.id ?? "none"}`}
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
                roomNumber: editingItem.roomNumber,
                capacity: editingItem.capacity,
                type: editingItem.type,
                buildingName: editingItem.buildingName,
                floorNumber: editingItem.floorNumber,
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
              <Building className="size-5 text-primary" />
              <Typography as="h2" variant="h3">
                {t("title")}
              </Typography>
            </div>
            <Button type="button" size="sm" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="size-4" />
              {t("newClassroom")}
            </Button>
          </div>
          <Typography variant="muted">{t("description")}</Typography>
        </section>

        <section className={cardClassName}>
          <Typography as="h3" variant="h4" className="mb-4">
            {t("existingClassrooms")}
          </Typography>
          {isLoading ? (
            <DashboardPanelSkeleton />
          ) : (
            <DynamicTable data={classrooms} columns={columns} getRowKey={(row) => row.id} emptyMessage={t("emptyState")} />
          )}
        </section>
      </div>
    </>
  );
}
