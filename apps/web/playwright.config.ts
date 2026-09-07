import { defineConfig } from "@playwright/test"
import { loadEnv } from "vite"

const env = loadEnv("development", process.cwd(), "VITE_")
Object.assign(process.env, env)
const api = new URL(env.VITE_SUPABASE_URL || "http://invalid")
if (!["localhost", "127.0.0.1"].includes(api.hostname)) throw new Error("Browser tests require local Supabase.")

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: false,
  workers: 1,
  use: { baseURL: "http://localhost:5188", channel: "chrome", trace: "retain-on-failure" },
  webServer: { command: "pnpm dev --host localhost --port 5188 --strictPort", url: "http://localhost:5188", reuseExistingServer: false },
})
