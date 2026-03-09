import { z } from "zod";

const gradeBaseSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(2, { message: "nameTooShort" }),
  educationalStageId: z.string().trim().min(1, { message: "educationalStageRequired" }),
  minimumPassingGrade: z.coerce.number().min(0, { message: "minimumPassingGradeInvalid" }).max(100, {
    message: "minimumPassingGradeInvalid",
  }),
  isActive: z.boolean(),
});

export const gradeSchema = gradeBaseSchema;

export const gradePayloadSchema = gradeBaseSchema.omit({
  id: true,
});

export const gradeUpdateSchema = gradePayloadSchema.extend({
  id: z.string().trim().min(1),
});

export type GradeInput = z.infer<typeof gradeSchema>;
export type GradePayloadInput = z.infer<typeof gradePayloadSchema>;
export type GradeUpdateInput = z.infer<typeof gradeUpdateSchema>;
