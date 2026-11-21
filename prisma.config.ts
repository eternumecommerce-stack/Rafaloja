import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // A CLI (migrate, db push, studio) usa a conexão direta (session pooler, porta 5432).
  // O app em runtime usa DATABASE_URL (transaction pooler) via adapter em lib/db.ts.
  datasource: {
    url: env("DIRECT_URL"),
  },
});
