import { z } from "zod";

const sectionBaseSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(2, { message: "nameTooShort" }),
  gradeId: z.string().trim().min(1, { message: "gradeRequired" }),
  defaultCapacity: z.coerce.number().int().min(1, { message: "defaultCapacityInvalid" }).max(200, {
    message: "defaultCapacityInvalid",
  }),
  supervisorUserId: z.string().trim().min(1, { message: "supervisorRequired" }),
});

export const sectionSchema = sectionBaseSchema;

export const sectionPayloadSchema = sectionBaseSchema.omit({
  id: true,
});

export const sectionUpdateSchema = sectionPayloadSchema.extend({
  id: z.string().trim().min(1),
});

export type SectionInput = z.infer<typeof sectionSchema>;
export type SectionPayloadInput = z.infer<typeof sectionPayloadSchema>;
export type SectionUpdateInput = z.infer<typeof sectionUpdateSchema>;
