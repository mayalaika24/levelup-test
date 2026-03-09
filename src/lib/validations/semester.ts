import { z } from "zod";

const isoDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/);

const assessmentTypeSchema = z.enum(["monthly", "midterm", "final"]);

const semesterBaseSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(2, { message: "nameTooShort" }),
  academicYearId: z.string().trim().min(1, { message: "academicYearRequired" }),
  semesterStartDate: isoDateSchema,
  semesterEndDate: isoDateSchema,
  classesStartDate: isoDateSchema,
  classesEndDate: isoDateSchema,
  finalExamDate: isoDateSchema,
  assessmentType: assessmentTypeSchema,
});

function addDateRangeIssues(
  value: {
    semesterStartDate: string;
    semesterEndDate: string;
    classesStartDate: string;
    classesEndDate: string;
    finalExamDate: string;
  },
  ctx: z.RefinementCtx,
) {
  if (new Date(value.semesterStartDate) > new Date(value.semesterEndDate)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["semesterEndDate"],
      message: "semesterEndBeforeStart",
    });
  }

  if (new Date(value.classesStartDate) > new Date(value.classesEndDate)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["classesEndDate"],
      message: "classesEndBeforeStart",
    });
  }

  if (new Date(value.finalExamDate) < new Date(value.semesterStartDate)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["finalExamDate"],
      message: "finalExamBeforeSemesterStart",
    });
  }
}

export const semesterSchema = semesterBaseSchema.superRefine((value, ctx) => {
  addDateRangeIssues(value, ctx);
});

const semesterPayloadBaseSchema = semesterBaseSchema.omit({
  id: true,
});
export const semesterPayloadSchema = semesterPayloadBaseSchema.superRefine((value, ctx) => {
  addDateRangeIssues(value, ctx);
});

const semesterUpdateBaseSchema = semesterPayloadBaseSchema.extend({
  id: z.string().trim().min(1),
});
export const semesterUpdateSchema = semesterUpdateBaseSchema.superRefine((value, ctx) => {
  addDateRangeIssues(value, ctx);
});

export type AssessmentType = z.infer<typeof assessmentTypeSchema>;
export type SemesterInput = z.infer<typeof semesterSchema>;
export type SemesterPayloadInput = z.infer<typeof semesterPayloadSchema>;
export type SemesterUpdateInput = z.infer<typeof semesterUpdateSchema>;
