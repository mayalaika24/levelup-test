import { z } from "zod";

const currentYear = new Date().getFullYear();
const websitePattern = /^https?:\/\/.+/i;

const socialLinkSchema = z
  .string()
  .trim()
  .refine((value) => value.length === 0 || websitePattern.test(value), {
    message: "Please enter a valid URL starting with http:// or https://",
  });

export const schoolSettingsSchema = z.object({
  schoolNameAr: z.string().trim().min(2),
  schoolNameEn: z.string().trim().min(2),
  foundedYear: z.coerce.number().int().min(1900).max(currentYear),
  currency: z.string().trim().min(1),
  allowMultiCurrency: z.boolean(),
  commercialRegisterNumber: z.string().trim().min(3),
  showLogoInInvoices: z.boolean(),
  timezone: z.string().trim().min(1),
  defaultSystemLanguage: z.string().trim().min(1),
  notificationsEnabled: z.boolean(),
  country: z.string().trim().min(2),
  city: z.string().trim().min(2),
  detailedAddress: z.string().trim().min(10),
  primaryPhone: z
    .string()
    .trim()
    .min(8)
    .regex(/^[\d+\-\s()]+$/),
  primaryEmail: z.string().trim().email(),
  website: z
    .string()
    .trim()
    .refine((value) => value.length === 0 || websitePattern.test(value), {
      message: "Please enter a valid URL starting with http:// or https://",
    }),
  socialMedia: z.object({
    facebook: socialLinkSchema,
    instagram: socialLinkSchema,
    x: socialLinkSchema,
    linkedIn: socialLinkSchema,
  }),
});

export const basicSchoolSettingsSchema = schoolSettingsSchema.pick({
  schoolNameAr: true,
  schoolNameEn: true,
  foundedYear: true,
  currency: true,
  allowMultiCurrency: true,
  commercialRegisterNumber: true,
  showLogoInInvoices: true,
  timezone: true,
  defaultSystemLanguage: true,
  notificationsEnabled: true,
});

export const contactSchoolSettingsSchema = schoolSettingsSchema.pick({
  country: true,
  city: true,
  detailedAddress: true,
  primaryPhone: true,
  primaryEmail: true,
  website: true,
});

export const socialSchoolSettingsSchema = schoolSettingsSchema.shape.socialMedia;
export const contactAndSocialSchoolSettingsSchema = contactSchoolSettingsSchema.extend({
  socialMedia: socialSchoolSettingsSchema,
});

export const persistedSchoolSettingsSchema = schoolSettingsSchema.extend({
  logoFileName: z.string().optional(),
  sealFileName: z.string().optional(),
});

export type SchoolSettingsSchemaInput = z.input<typeof schoolSettingsSchema>;
export type SchoolSettingsInput = z.infer<typeof schoolSettingsSchema>;
export type BasicSchoolSettingsInput = z.infer<typeof basicSchoolSettingsSchema>;
export type ContactSchoolSettingsInput = z.infer<typeof contactSchoolSettingsSchema>;
export type SocialSchoolSettingsInput = z.infer<typeof socialSchoolSettingsSchema>;
export type ContactAndSocialSchoolSettingsInput = z.infer<typeof contactAndSocialSchoolSettingsSchema>;
export type PersistedSchoolSettingsInput = z.infer<typeof persistedSchoolSettingsSchema>;
