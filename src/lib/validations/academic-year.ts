import { z } from "zod";

const isoDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/);

const academicYearBaseSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(2),
  startDate: isoDateSchema,
  endDate: isoDateSchema,
  enrollmentStartDate: isoDateSchema,
  enrollmentEndDate: isoDateSchema,
  allowGradeEditAfterEnd: z.boolean(),
  allowStudentFileEditAfterEnd: z.boolean(),
  numberOfSemesters: z.coerce.number().int().min(1).max(8),
  isActive: z.boolean(),
  hasActiveStudentRecord: z.boolean(),
});

function addDateRangeIssues(
  value: {
    startDate: string;
    endDate: string;
    enrollmentStartDate: string;
    enrollmentEndDate: string;
  },
  ctx: z.RefinementCtx,
) {
  if (new Date(value.startDate) > new Date(value.endDate)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endDate"],
      message: "End date must be on or after start date.",
    });
  }

  if (new Date(value.enrollmentStartDate) > new Date(value.enrollmentEndDate)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["enrollmentEndDate"],
      message: "Enrollment end date must be on or after enrollment start date.",
    });
  }
}

export const academicYearSchema = academicYearBaseSchema.superRefine((value, ctx) => {
  addDateRangeIssues(value, ctx);
});

const academicYearPayloadBaseSchema = academicYearBaseSchema.omit({
  id: true,
  hasActiveStudentRecord: true,
});
export const academicYearPayloadSchema = academicYearPayloadBaseSchema.superRefine((value, ctx) => {
  addDateRangeIssues(value, ctx);
});

const academicYearUpdateBaseSchema = academicYearPayloadBaseSchema.extend({
  id: z.string().trim().min(1),
});
export const academicYearUpdateSchema = academicYearUpdateBaseSchema.superRefine((value, ctx) => {
  addDateRangeIssues(value, ctx);
});

export type AcademicYearInput = z.infer<typeof academicYearSchema>;
export type AcademicYearPayloadInput = z.infer<typeof academicYearPayloadSchema>;
export type AcademicYearUpdateInput = z.infer<typeof academicYearUpdateSchema>;
