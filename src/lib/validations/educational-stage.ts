import { z } from "zod";

const educationalStageBaseSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(2, { message: "nameTooShort" }),
  minimumStudentAge: z.coerce.number().int().min(3, { message: "minimumAgeInvalid" }),
  teachingLanguage: z.string().trim().min(2, { message: "teachingLanguageTooShort" }),
  isMixedStage: z.boolean(),
});

export const educationalStageSchema = educationalStageBaseSchema;

export const educationalStagePayloadSchema = educationalStageBaseSchema.omit({
  id: true,
});

export const educationalStageUpdateSchema = educationalStagePayloadSchema.extend({
  id: z.string().trim().min(1),
});

export type EducationalStageInput = z.infer<typeof educationalStageSchema>;
export type EducationalStagePayloadInput = z.infer<typeof educationalStagePayloadSchema>;
export type EducationalStageUpdateInput = z.infer<typeof educationalStageUpdateSchema>;
