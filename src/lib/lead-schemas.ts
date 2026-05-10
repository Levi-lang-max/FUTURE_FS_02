import { z } from "zod";

export const STATUSES = ["new", "contacted", "converted", "lost"] as const;
export type LeadStatus = typeof STATUSES[number];

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const leadEditSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).nullable(),
  company: z.string().trim().max(120).nullable(),
  message: z.string().trim().max(2000).nullable(),
  status: z.enum(STATUSES),
});

export const noteSchema = z.object({
  body: z.string().trim().min(1, "Note cannot be empty").max(2000),
});
