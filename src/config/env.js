console.log("hello world");

const { z } = require("zod");

const envSchema = z.object({
  OPENWEATHER_API_KEY: z.string().min(1, "OPENWEATHER_API_KEY is required"),
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(720),
  REDIS_URL: z.string().optional(),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
});

function loadEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const messages = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    console.error("Environment validation failed:\n", messages);
    process.exit(1);
  }

  return result.data;
}

module.exports = { loadEnv };
