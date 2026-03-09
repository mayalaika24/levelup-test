import { z } from "zod";

export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be less than 50 characters")
    .regex(
      /^[A-Za-z0-9._-]+$/,
      "Username can only contain letters, numbers, dot, underscore, and dash",
    ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be less than 72 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;
