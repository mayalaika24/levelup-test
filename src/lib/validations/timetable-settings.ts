import { z } from "zod";

const timeSchema = z.string().trim().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "invalidTime" });

export const teachingDaySchema = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

export const timetableSessionSchema = z
  .object({
    name: z.string().trim().min(2, { message: "nameTooShort" }),
    teachingDays: z.array(teachingDaySchema).min(1, { message: "teachingDaysRequired" }),
    startTime: timeSchema,
    endTime: timeSchema,
    durationMinutes: z.coerce.number().int().min(1, { message: "durationInvalid" }),
    requiresAttendance: z.boolean(),
    hasBreakAfter: z.boolean(),
    breakName: z.string().trim().optional().default(""),
    breakStartTime: z.string().trim().optional().default(""),
    breakEndTime: z.string().trim().optional().default(""),
    breakDurationMinutes: z.coerce.number().int().min(0, { message: "breakDurationInvalid" }),
  })
  .superRefine((value, ctx) => {
    const start = new Date(`1970-01-01T${value.startTime}:00`);
    const end = new Date(`1970-01-01T${value.endTime}:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endTime"],
        message: "endTimeBeforeStart",
      });
    }

    if (value.hasBreakAfter) {
      if ((value.breakName ?? "").trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["breakName"],
          message: "breakNameTooShort",
        });
      }

      if (!value.breakStartTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["breakStartTime"],
          message: "breakStartTimeRequired",
        });
      }

      if (!value.breakEndTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["breakEndTime"],
          message: "breakEndTimeRequired",
        });
      }

      if (value.breakStartTime && value.breakEndTime) {
        const breakStart = new Date(`1970-01-01T${value.breakStartTime}:00`);
        const breakEnd = new Date(`1970-01-01T${value.breakEndTime}:00`);

        if (Number.isNaN(breakStart.getTime()) || Number.isNaN(breakEnd.getTime()) || breakEnd <= breakStart) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["breakEndTime"],
            message: "breakEndTimeBeforeStart",
          });
        }
      }
    }
  });

const timetableSettingsBaseSchema = z
  .object({
    numberOfSessions: z.coerce.number().int().min(1, { message: "numberOfSessionsInvalid" }).max(20, {
      message: "numberOfSessionsInvalid",
    }),
    sessions: z.array(timetableSessionSchema),
  })
  .superRefine((value, ctx) => {
    if (value.sessions.length !== value.numberOfSessions) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sessions"],
        message: "sessionsCountMismatch",
      });
    }
  });

export const timetableSettingsSchema = timetableSettingsBaseSchema;
export const timetableSettingsPayloadSchema = timetableSettingsBaseSchema;

export type TeachingDay = z.infer<typeof teachingDaySchema>;
export type TimetableSessionInput = z.infer<typeof timetableSessionSchema>;
export type TimetableSettingsInput = z.infer<typeof timetableSettingsSchema>;
export type TimetableSettingsPayloadInput = z.infer<typeof timetableSettingsPayloadSchema>;
