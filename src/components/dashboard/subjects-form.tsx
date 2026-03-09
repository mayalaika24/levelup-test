 "use client";

import Link from "next/link";
import { BookMarked, PencilLine, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { DashboardPanelSkeleton } from "@/components/dashboard/loading-skeletons";
import { DynamicTable, type DynamicTableColumn } from "@/components/ui/dynamic-table";
import { Typography } from "@/components/ui/typography";
import { type GradeInput } from "@/lib/validations/grade";
import { type SubjectInput } from "@/lib/validations/subject";

type UserInput = {
  id: string;
  name: string;
  role: string;
};

const cardClassName = "rounded-2xl border border-border bg-card/80 p-5 shadow-xs sm:p-6";

type DeleteDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
};

function DeleteDialog({ open, onClose, onConfirm, isDeleting }: DeleteDialogProps) {
  const t = useTranslations("Subjects");

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

export function SubjectsForm() {
  const t = useTranslations("Subjects");
  const [subjects, setSubjects] = useState<SubjectInput[]>([]);
  const [grades, setGrades] = useState<GradeInput[]>([]);
  const [users, setUsers] = useState<UserInput[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<SubjectInput | null>(null);

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
        const [subjectsResponse, gradesResponse, usersResponse] = await Promise.all([
          fetch("/api/subjects"),
          fetch("/api/grades"),
          fetch("/api/users"),
        ]);
        if (!subjectsResponse.ok || !gradesResponse.ok || !usersResponse.ok) {
          throw new Error("Failed to load subjects data.");
        }

        const subjectsData = (await subjectsResponse.json()) as SubjectInput[];
        const gradesData = (await gradesResponse.json()) as GradeInput[];
        const usersData = (await usersResponse.json()) as UserInput[];

        if (isMounted) {
          setSubjects(subjectsData);
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

  async function handleDelete() {
    if (!deleteCandidate) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/subjects?id=${encodeURIComponent(deleteCandidate.id)}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Failed to delete subject.");
      }

      const updated = (await response.json()) as SubjectInput[];
      setSubjects(updated);
      setDeleteCandidate(null);
      toast.success(t("deleted"));
    } catch {
      toast.error(t("deleteFailed"));
    } finally {
      setIsSaving(false);
    }
  }

  const columns = useMemo<DynamicTableColumn<SubjectInput>[]>(
    () => [
      {
        key: "name",
        header: t("table.name"),
        render: (row) => row.name,
      },
      {
        key: "type",
        header: t("table.type"),
        render: (row) => t(`types.${row.type}`),
      },
      {
        key: "teachingLanguage",
        header: t("table.teachingLanguage"),
        render: (row) => row.teachingLanguage,
      },
      {
        key: "grades",
        header: t("table.grades"),
        render: (row) => row.gradeConfigs.map((config) => gradeNameById[config.gradeId] ?? "-").join("، "),
      },
      {
        key: "teachers",
        header: t("table.teachers"),
        render: (row) => row.teacherIds.map((id) => userNameById[id] ?? "-").join("، "),
      },
      {
        key: "minimumPassingGrade",
        header: t("table.minimumPassingGrade"),
        render: (row) => `${row.minimumPassingGrade}%`,
      },
      {
        key: "actions",
        header: t("table.actions"),
        className: "w-[180px]",
        render: (row) => (
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/subjects/${row.id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              <PencilLine className="size-4" />
              {t("edit")}
            </Link>
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
              <BookMarked className="size-5 text-primary" />
              <Typography as="h2" variant="h3">
                {t("title")}
              </Typography>
            </div>
            <Link href="/dashboard/subjects/new" className={buttonVariants({ size: "sm" })}>
              <Plus className="size-4" />
              {t("newSubject")}
            </Link>
          </div>
          <Typography variant="muted">{t("description")}</Typography>
        </section>

        <section className={cardClassName}>
          <Typography as="h3" variant="h4" className="mb-4">
            {t("existingSubjects")}
          </Typography>
          {isLoading ? (
            <DashboardPanelSkeleton />
          ) : (
            <DynamicTable data={subjects} columns={columns} getRowKey={(row) => row.id} emptyMessage={t("emptyState")} />
          )}
        </section>
      </div>
    </>
  );
}
