import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "prisma db execute --file prisma/seed.sql",
  },
  datasource: {
    // `prisma generate` runs without a database (e.g. during `docker build`).
    url: process.env.DATABASE_URL ?? "postgresql://localhost:5432/placeholder",
  },
});
