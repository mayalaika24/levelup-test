import { SubjectEditorForm } from "@/components/dashboard/subject-editor-form";

type EditSubjectPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditSubjectPage({ params }: EditSubjectPageProps) {
  const { id } = await params;
  return <SubjectEditorForm mode="edit" subjectId={id} />;
}
