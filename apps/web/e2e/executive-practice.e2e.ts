import { expect, test } from "@playwright/test"
import catalog from "../../../content/executive-questions.json" with { type: "json" }

test.beforeEach(async ({ page, request }) => {
  const api = process.env.VITE_SUPABASE_URL!
  const response = await request.post(`${api}/auth/v1/signup`, {
    headers: { apikey: process.env.VITE_SUPABASE_PUBLISHABLE_KEY! },
    data: { email: `practice-${crypto.randomUUID()}@example.test`, password: crypto.randomUUID(), data: { full_name: "Local tester" } },
  })
  expect(response.ok()).toBeTruthy()
  const session = await response.json()
  expect(session.access_token).toBeTruthy()
  await page.addInitScript(({ key, session }) => {
    localStorage.setItem(key, JSON.stringify(session))
  }, { key: `sb-${new URL(api).hostname.split(".")[0]}-auth-token`, session })
  await page.goto("/home")
  await expect(page.getByRole("heading", { name: "Ready to train?" })).toBeVisible()
})

test("single-track practice saves answers and falls back only after all ten questions", async ({ page }) => {
  await page.getByRole("button", { name: /executive focus/i }).click()
  await page.getByRole("menuitemcheckbox", { name: "Chief Financial Officer" }).click()
  await page.keyboard.press("Escape")
  await page.getByRole("button", { name: /start training/i }).click()
  const seen = new Set<string>()
  for (let i = 0; i < 10; i++) {
    await expect(page.getByRole("textbox", { name: "Your answer" })).toBeVisible()
    const prompt = await page.getByRole("heading", { level: 1 }).innerText()
    const question = catalog.find((row) => row.prompt === prompt)
    expect(question?.executive_track).toBe("cfo")
    expect(seen.has(prompt)).toBe(false)
    seen.add(prompt)
    await page.getByRole("textbox", { name: "Your answer" }).fill(String(question!.correct_answer))
    await page.getByRole("button", { name: /check answer/i }).click()
    await page.getByRole("button", { name: /next question/i }).click()
  }
  const fallback = await page.getByRole("heading", { level: 1 }).innerText()
  expect(catalog.some(({ prompt }) => prompt === fallback)).toBe(false)
  await page.getByRole("button", { name: /leave session/i }).click()
  await page.getByRole("button", { name: /^end session$/i }).click()
  await expect(page.getByRole("dialog", { name: "Session complete" })).toBeVisible()
  await expect(page.getByRole("dialog").getByText("100%")).toBeVisible()
})

test("multiple focus persists across reload and uses only the selected tracks", async ({ page }) => {
  await page.getByRole("button", { name: /executive focus/i }).click()
  await page.getByRole("menuitemcheckbox", { name: "Chief Technology Officer" }).click()
  await page.getByRole("menuitemcheckbox", { name: "Chief Marketing Officer" }).click()
  await page.keyboard.press("Escape")
  await page.reload()
  await expect(page.getByRole("button", { name: "Executive focus: CMO + CTO" })).toBeVisible()
  await page.getByRole("button", { name: /start training/i }).click()
  await expect(page.getByRole("textbox", { name: "Your answer" })).toBeVisible()
  await expect(page.getByLabel("Executive focus: CMO + CTO")).toBeVisible()
  const prompt = await page.getByRole("heading", { level: 1 }).innerText()
  expect(["cto", "cmo"]).toContain(catalog.find((row) => row.prompt === prompt)?.executive_track)
})

test("Quick start uses all tracks despite a saved single focus", async ({ page }) => {
  await page.getByRole("button", { name: /executive focus/i }).click()
  await page.getByRole("menuitemcheckbox", { name: "Chief Financial Officer" }).click()
  await page.keyboard.press("Escape")
  const sessionWrite = page.waitForRequest((request) => request.url().includes("/rest/v1/practice_sessions") && request.method() === "POST")
  await page.getByRole("button", { name: /quick start/i }).click()
  expect((await sessionWrite).postDataJSON().selected_tracks).toHaveLength(11)
  await expect(page.getByLabel("Executive focus: All tracks")).toBeVisible()
})

test("All is the default and balances the first round across eleven tracks", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Executive focus: All tracks" })).toBeVisible()
  await page.getByRole("button", { name: /start training/i }).click()
  const tracks = new Set<string>()
  for (let i = 0; i < 11; i++) {
    await expect(page.getByRole("textbox", { name: "Your answer" })).toBeVisible()
    const prompt = await page.getByRole("heading", { level: 1 }).innerText()
    const question = catalog.find((row) => row.prompt === prompt)!
    tracks.add(question.executive_track)
    await page.getByRole("textbox", { name: "Your answer" }).fill(String(question.correct_answer))
    await page.getByRole("button", { name: /check answer/i }).click()
    await page.getByRole("button", { name: /next question/i }).click()
  }
  expect(tracks.size).toBe(11)
})
