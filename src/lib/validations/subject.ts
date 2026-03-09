import { z } from "zod";

const subjectTypeSchema = z.enum(["core", "enrichment"]);

const subjectGradeConfigSchema = z.object({
  gradeId: z.string().trim().min(1, { message: "gradeRequired" }),
  weeklySessions: z.coerce.number().int().min(1, { message: "weeklySessionsInvalid" }).max(20, {
    message: "weeklySessionsInvalid",
  }),
  lessonDurationMinutes: z.coerce.number().int().min(20, { message: "lessonDurationInvalid" }).max(180, {
    message: "lessonDurationInvalid",
  }),
});

const subjectScoreBreakdownSchema = z.object({
  activityName: z.string().trim().min(2, { message: "activityNameTooShort" }),
  percentage: z.coerce.number().min(0, { message: "activityPercentageInvalid" }).max(100, {
    message: "activityPercentageInvalid",
  }),
});

const subjectBaseSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(2, { message: "nameTooShort" }),
  type: subjectTypeSchema,
  teachingLanguage: z.string().trim().min(2, { message: "teachingLanguageTooShort" }),
  gradeConfigs: z.array(subjectGradeConfigSchema).min(1, { message: "atLeastOneGradeConfig" }),
  teacherIds: z.array(z.string().trim().min(1)).min(1, { message: "atLeastOneTeacher" }),
  includedInAverage: z.boolean(),
  needsLab: z.boolean(),
  hasQuestionBank: z.boolean(),
  minimumPassingGrade: z.coerce.number().min(0, { message: "minimumPassingGradeInvalid" }).max(100, {
    message: "minimumPassingGradeInvalid",
  }),
  scoreBreakdown: z.array(subjectScoreBreakdownSchema).min(1, { message: "atLeastOneScoreBreakdown" }),
});

function addSubjectIssues(
  value: {
    gradeConfigs: Array<{ gradeId: string }>;
    teacherIds: string[];
    scoreBreakdown: Array<{ percentage: number }>;
  },
  ctx: z.RefinementCtx,
) {
  const gradeIds = value.gradeConfigs.map((item) => item.gradeId.trim());
  const uniqueGradeCount = new Set(gradeIds).size;
  if (uniqueGradeCount !== gradeIds.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["gradeConfigs"],
      message: "duplicateGradeConfig",
    });
  }

  const teacherIds = value.teacherIds.map((item) => item.trim());
  const uniqueTeacherCount = new Set(teacherIds).size;
  if (uniqueTeacherCount !== teacherIds.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["teacherIds"],
      message: "duplicateTeacher",
    });
  }

  const totalPercentage = value.scoreBreakdown.reduce((sum, item) => sum + item.percentage, 0);
  if (Math.round(totalPercentage * 100) / 100 !== 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["scoreBreakdown"],
      message: "scoreBreakdownMustTotal100",
    });
  }
}

export const subjectSchema = subjectBaseSchema.superRefine((value, ctx) => {
  addSubjectIssues(value, ctx);
});

const subjectPayloadBaseSchema = subjectBaseSchema.omit({
  id: true,
});

export const subjectPayloadSchema = subjectPayloadBaseSchema.superRefine((value, ctx) => {
  addSubjectIssues(value, ctx);
});

const subjectUpdateBaseSchema = subjectPayloadBaseSchema.extend({
  id: z.string().trim().min(1),
});

export const subjectUpdateSchema = subjectUpdateBaseSchema.superRefine((value, ctx) => {
  addSubjectIssues(value, ctx);
});

export type SubjectType = z.infer<typeof subjectTypeSchema>;
export type SubjectInput = z.infer<typeof subjectSchema>;
export type SubjectPayloadInput = z.infer<typeof subjectPayloadSchema>;
export type SubjectUpdateInput = z.infer<typeof subjectUpdateSchema>;
