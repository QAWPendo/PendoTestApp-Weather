console.log("hello world");

const { z } = require("zod");

const feedbackBodySchema = z.object({
  name: z
    .string()
    .max(100, "Name must be 100 characters or fewer")
    .optional()
    .transform((val) => (val?.trim() ? val.trim() : undefined)),
  email: z
    .string()
    .max(200)
    .optional()
    .transform((val) => (val?.trim() ? val.trim() : undefined))
    .refine((val) => !val || z.string().email().safeParse(val).success, {
      message: "Invalid email address",
    }),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  category: z
    .enum(["bug", "feature", "general", "api", "other"])
    .optional()
    .default("general"),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message must be 2000 characters or fewer")
    .transform((val) => val.trim()),
});

module.exports = { feedbackBodySchema };
