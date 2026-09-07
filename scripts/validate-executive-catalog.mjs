import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

const root = new URL("../", import.meta.url)
const read = (path) => readFileSync(new URL(path, root), "utf8")
const taxonomy = JSON.parse(read("apps/web/src/features/training/executive-taxonomy.json"))
export const catalog = JSON.parse(read("content/executive-questions.json"))

// A deliberately small arithmetic grammar: no identifiers, calls or executable code.
export function calculate(expression) {
  assert.match(expression, /^[\d\s.+*/()-]+$/)
  const tokens = expression.match(/\d*\.?\d+|[()+*/-]/g)
  let index = 0
  function atom() {
    const token = tokens[index++]
    if (token === "(") {
      const value = sum()
      assert.equal(tokens[index++], ")")
      return value
    }
    assert.match(token ?? "", /^\d*\.?\d+$/)
    return Number(token)
  }
  function product() {
    let value = atom()
    while (["*", "/"].includes(tokens[index])) {
      const operator = tokens[index++]
      const right = atom()
      value = operator === "*" ? value * right : value / right
    }
    return value
  }
  function sum() {
    let value = product()
    while (["+", "-"].includes(tokens[index])) {
      const operator = tokens[index++]
      const right = product()
      value = operator === "+" ? value + right : value - right
    }
    return value
  }
  const value = sum()
  assert.equal(index, tokens.length)
  assert.ok(Number.isFinite(value))
  return value
}

export function validate(rows) {
  assert.equal(rows.length, 110, "Expected 110 questions")
  const slugs = new Set()
  const prompts = new Set()
  for (const row of rows) {
    const track = taxonomy.find(({ slug }) => slug === row.executive_track)
    assert.ok(track?.categories.includes(row.category_slug), `${row.slug}: invalid taxonomy`)
    for (const field of ["slug", "prompt", "instruction", "unit", "hint"]) {
      assert.ok(typeof row[field] === "string" && row[field].trim(), `${row.slug}: missing ${field}`)
      assert.ok(!row[field].includes("\u2014"), `${row.slug}: em dash in ${field}`)
    }
    assert.match(row.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    assert.ok(!slugs.has(row.slug), `Duplicate slug: ${row.slug}`)
    slugs.add(row.slug)
    const prompt = row.prompt.toLowerCase().replace(/[^a-z0-9]/g, "")
    assert.ok(!prompts.has(prompt), `Duplicate prompt: ${row.slug}`)
    prompts.add(prompt)
    assert.ok([1, 2, 3].includes(row.difficulty))
    // Friendliness 5 needs a separate estimation review; this release excludes it.
    assert.ok([1, 2, 3, 4].includes(row.number_friendliness))
    assert.ok(Number.isInteger(row.operation_count) && row.operation_count > 0)
    assert.equal(row.publication_status, "published")
    assert.ok(Number.isFinite(row.correct_answer) && Math.abs(row.correct_answer * 100 - Math.round(row.correct_answer * 100)) < 1e-8)
    assert.ok(Number.isFinite(row.answer_tolerance) && row.answer_tolerance >= 0)
    const calculated = calculate(row.verification_expression)
    assert.ok(Math.abs(Math.round(calculated * 100) / 100 - row.correct_answer) < 1e-8, `${row.slug}: incorrect canonical answer`)
    assert.ok(Math.abs(calculated - row.correct_answer) <= row.answer_tolerance + 1e-8, `${row.slug}: tolerance excludes unrounded answer`)
  }
  for (const track of taxonomy) {
    const questions = rows.filter(({ executive_track }) => executive_track === track.slug)
    assert.equal(questions.length, 10, track.slug)
    assert.deepEqual([1, 2, 3].map((level) => questions.filter(({ difficulty }) => difficulty === level).length), [5, 3, 2], track.slug)
    for (const category of track.categories) assert.ok(questions.filter(({ category_slug }) => category_slug === category).length <= 2)
  }
}

export function catalogMigration(rows) {
  const columns = ["slug", "category", "executive_track", "category_slug", "difficulty", "number_friendliness", "operation_count", "publication_status", "prompt", "instruction", "unit", "correct_answer", "answer_tolerance", "hint"]
  const literal = (value) => typeof value === "number" ? String(value) : `'${value.replaceAll("'", "''")}'`
  const values = rows.map((row) => {
    const mapped = { ...row, category: row.category_slug.replaceAll("-", " ") }
    return `  (${columns.map((column) => literal(mapped[column])).join(", ")})`
  })
  return `-- Initial reviewed executive catalog. Do not update legacy or previously answered rows.\ninsert into public.questions (${columns.join(", ")})\nvalues\n${values.join(",\n")};\n`
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  validate(catalog)
  assert.equal(read("supabase/migrations/20260907001000_seed_executive_questions.sql"), catalogMigration(catalog), "Catalog migration differs from reviewed source")
  console.log("Validated 110 questions, 11 tracks, 5/3/2 per track, taxonomy, precision and all canonical answers.")
}
