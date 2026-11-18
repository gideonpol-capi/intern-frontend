// Task 6: login and sign-up forms with validation.
import { fireEvent, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, test } from "vitest"
import { jane, load, renderApp } from "./helpers"

const input = (label: RegExp) => screen.getByLabelText(label, { selector: "input" })
const invalid = (label: RegExp) => input(label).getAttribute("aria-invalid") === "true"
const fields = {
  name: /^(full )?name/i,
  email: /^e-?mail/i,
  password: /^password/i,
  phone: /phone/i,
  birthDate: /birth/i,
}
const signUpButton = () => screen.getByRole("button", { name: /sign ?up|register|create account/i })

function yearsAgo(years: number) {
  const date = new Date()
  date.setFullYear(date.getFullYear() - years)
  return date.toISOString().slice(0, 10)
}

async function fillSignUp(values: Partial<Record<keyof typeof fields, string>>) {
  const all = { name: "Jane Cooper", email: jane.email, password: "secret-pass", phone: "+31 6 12345678", ...values }
  for (const key of ["name", "email", "password", "phone"] as const) {
    if (all[key]) await userEvent.type(input(fields[key]), all[key])
  }
  fireEvent.change(input(fields.birthDate), { target: { value: values.birthDate ?? "1995-05-17" } })
}

describe("validation functions", () => {
  test("isEmail", async () => {
    const isEmail = await load<(value: string) => boolean>("src/utils/validation.ts", "isEmail")
    for (const ok of ["jane@example.com", "j.cooper+test@mail.co.uk"]) expect(isEmail(ok), ok).toBe(true)
    for (const bad of ["", "jane", "jane@", "jane@example", "@example.com", "jane @example.com"]) {
      expect(isEmail(bad), `"${bad}" is not an email address`).toBe(false)
    }
  })

  test("isPhone", async () => {
    const isPhone = await load<(value: string) => boolean>("src/utils/validation.ts", "isPhone")
    for (const ok of ["+31 6 12345678", "0612345678", "020-1234567"]) expect(isPhone(ok), ok).toBe(true)
    for (const bad of ["", "abc", "12345", "+31 6 1234abcd", "1234567890123456"]) {
      expect(isPhone(bad), `"${bad}" is not a phone number`).toBe(false)
    }
  })

  test("isAdult counts from the 18th birthday", async () => {
    const isAdult = await load<(birthDate: string, today?: Date) => boolean>("src/utils/validation.ts", "isAdult")
    const today = new Date(2026, 10, 18) // 18 November 2026
    expect(isAdult("2008-11-18", today), "18 today: adult").toBe(true)
    expect(isAdult("2008-11-19", today), "18 tomorrow: not yet").toBe(false)
    expect(isAdult("1990-01-01", today)).toBe(true)
    expect(isAdult("2015-06-01", today)).toBe(false)
    expect(isAdult("", today), "an empty date is not adult").toBe(false)
  })
})

describe("login", () => {
  test("an invalid email shows an error and does not log in", async () => {
    const app = await renderApp("/login")
    await userEvent.type(input(fields.email), "jane")
    await userEvent.type(input(fields.password), "secret-pass")
    await userEvent.click(screen.getByRole("button", { name: /^log ?in$/i }))
    expect(invalid(fields.email), "Show an error on an invalid email.").toBe(true)
    expect(app.path).toBe("/login")
    expect(localStorage.getItem("user")).toBeNull()
  })

  test("links to the sign-up page", async () => {
    const app = await renderApp("/login")
    await userEvent.click(screen.getByRole("link", { name: /sign ?up/i }))
    await waitFor(() => expect(app.path).toBe("/register"))
  })
})

describe("sign up", () => {
  test("logged in, /register sends you to /dashboard", async () => {
    const app = await renderApp("/register", jane)
    await waitFor(() => expect(app.path, "Wrap /register in PublicRoute.").toBe("/dashboard"))
  })

  test("an empty form marks every field", async () => {
    const app = await renderApp("/register")
    await userEvent.click(signUpButton())
    for (const [key, label] of Object.entries(fields)) expect(invalid(label), `${key} should show an error`).toBe(true)
    expect(app.path).toBe("/register")
  })

  test("rejects a phone number that isn't one", async () => {
    await renderApp("/register")
    await fillSignUp({ phone: "abc" })
    await userEvent.click(signUpButton())
    expect(invalid(fields.phone)).toBe(true)
    expect(invalid(fields.name)).toBe(false)
  })

  test("rejects someone younger than 18", async () => {
    const app = await renderApp("/register")
    await fillSignUp({ birthDate: yearsAgo(17) })
    await userEvent.click(signUpButton())
    expect(invalid(fields.birthDate), "Show an error when the user is younger than 18.").toBe(true)
    expect(app.path).toBe("/register")
  })

  test("a valid form logs you in with name and email, never the password", async () => {
    const app = await renderApp("/register")
    await fillSignUp({})
    await userEvent.click(signUpButton())
    await waitFor(() => expect(app.path).toBe("/dashboard"))
    const stored = localStorage.getItem("user") ?? ""
    expect(JSON.parse(stored || "{}"), "register() stores { name, email }.").toMatchObject({
      name: "Jane Cooper",
      email: jane.email,
    })
    expect(stored).not.toContain("secret-pass")
  })
})
