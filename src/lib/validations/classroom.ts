import { z } from "zod";

const classroomTypeSchema = z.enum(["teaching", "lab", "computer", "theater", "sports"]);

const classroomBaseSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(2, { message: "nameTooShort" }),
  roomNumber: z.string().trim().min(1, { message: "roomNumberRequired" }),
  capacity: z.coerce.number().int().min(1, { message: "capacityInvalid" }).max(500, { message: "capacityInvalid" }),
  type: classroomTypeSchema,
  buildingName: z.string().trim().min(2, { message: "buildingNameTooShort" }),
  floorNumber: z.string().trim().min(1, { message: "floorNumberRequired" }),
});

export const classroomSchema = classroomBaseSchema;

export const classroomPayloadSchema = classroomBaseSchema.omit({
  id: true,
});

export const classroomUpdateSchema = classroomPayloadSchema.extend({
  id: z.string().trim().min(1),
});

export type ClassroomType = z.infer<typeof classroomTypeSchema>;
export type ClassroomInput = z.infer<typeof classroomSchema>;
export type ClassroomPayloadInput = z.infer<typeof classroomPayloadSchema>;
export type ClassroomUpdateInput = z.infer<typeof classroomUpdateSchema>;
