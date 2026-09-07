import { test } from "node:test"
import assert from "node:assert/strict"
import { calculate, catalog, validate } from "./validate-executive-catalog.mjs"

test("independent arithmetic handles precedence and rejects executable expressions", () => {
  assert.equal(calculate("(50+30)-20*3-15"), 5)
  assert.throws(() => calculate("process.exit()"))
  assert.throws(() => calculate("1/0"))
})

for (const [name, change] of Object.entries({
  answer: (rows) => { rows[0].correct_answer = 26 },
  precision: (rows) => { rows[0].correct_answer = 25.001 },
  duplicate: (rows) => { rows[1].slug = rows[0].slug },
  taxonomy: (rows) => { rows[0].category_slug = "activation" },
  distribution: (rows) => { rows[0].difficulty = 2 },
  tolerance: (rows) => { rows.find((row) => row.slug === "cio-model-f1-score").answer_tolerance = 0 },
})) {
  test(`rejects invalid ${name}`, () => {
    const rows = structuredClone(catalog)
    change(rows)
    assert.throws(() => validate(rows))
  })
}
