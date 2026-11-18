// Task 1: routing, route guards and login state.
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { expect, test, vi } from "vitest"
import { jane, load, renderApp } from "./helpers"

const emailInput = () => screen.getByLabelText(/^e-?mail/i, { selector: "input" })
const passwordInput = () => screen.getByLabelText(/^password/i, { selector: "input" })
const loginButton = () => screen.getByRole("button", { name: /^log ?in$/i })
const storedUser = () => localStorage.getItem("user")

test.each(["/dashboard", "/users", "/"])("logged out, %s sends you to /login", async (path) => {
  const app = await renderApp(path)
  await waitFor(() => expect(app.path, `Logged out, ${path} should end up on /login (PrivateRoute).`).toBe("/login"))
})

test("an empty field shows an error and does not log in", async () => {
  const app = await renderApp("/login")
  await userEvent.type(emailInput(), jane.email)
  await userEvent.click(loginButton())
  expect(passwordInput().getAttribute("aria-invalid"), 'Mark the empty password input with aria-invalid="true".').toBe(
    "true",
  )
  expect(app.path).toBe("/login")
  expect(storedUser(), "Nobody should be logged in after a failed login.").toBeNull()
})

test("logging in stores the email but never the password", async () => {
  const app = await renderApp("/login")
  await userEvent.type(emailInput(), jane.email)
  await userEvent.type(passwordInput(), "secret-pass")
  await userEvent.click(loginButton())
  await waitFor(() => expect(app.path, "After logging in you should land on /dashboard.").toBe("/dashboard"))
  expect(storedUser(), 'Save the user in localStorage under the key "user".').not.toBeNull()
  expect(JSON.parse(storedUser()!).email).toBe(jane.email)
  const everything = Object.keys(localStorage)
    .map((key) => localStorage.getItem(key))
    .join(" ")
  expect(everything, "The password must never be stored.").not.toContain("secret-pass")
})

test("pressing Enter in the form logs in", async () => {
  const app = await renderApp("/login")
  await userEvent.type(emailInput(), jane.email)
  await userEvent.type(passwordInput(), "secret-pass{Enter}")
  await waitFor(() => expect(app.path, "Put the inputs inside a <form> with an onSubmit.").toBe("/dashboard"))
})

test("logged in, /login sends you to /dashboard", async () => {
  const app = await renderApp("/login", jane)
  await waitFor(() => expect(app.path, "Logged in, /login should redirect (PublicRoute).").toBe("/dashboard"))
})

test("the login survives a refresh, without a flash of the login page", async () => {
  const app = await renderApp("/users", jane)
  await screen.findByRole("button", { name: /^log ?out$/i })
  expect(app.path).toBe("/users")
  expect(app.visited, "Read localStorage in the initial state: useState<User>(readStoredUser).").not.toContain("/login")
})

test("an unknown URL goes to /dashboard", async () => {
  const app = await renderApp("/does-not-exist", jane)
  await waitFor(() => expect(app.path).toBe("/dashboard"))
})

test("logging out sends you to /login and clears localStorage", async () => {
  const app = await renderApp("/dashboard", jane)
  await userEvent.click(await screen.findByRole("button", { name: /^log ?out$/i }))
  await waitFor(() => expect(app.path).toBe("/login"))
  expect(storedUser(), 'Remove the "user" key on logout.').toBeNull()
})

test("broken data in localStorage does not crash the app", async () => {
  localStorage.setItem("user", "abc")
  const app = await renderApp("/dashboard")
  await waitFor(() => expect(app.path, "Catch the JSON.parse error in readStoredUser and return null.").toBe("/login"))
})

test("useAuth throws outside AuthProvider", async () => {
  const useAuth = await load<() => unknown>("src/context/AuthContext.tsx", "useAuth")
  function Outside() {
    useAuth()
    return null
  }
  vi.spyOn(console, "error").mockImplementation(() => {})
  expect(() => render(<Outside />), "useAuth() should throw an Error when there is no AuthProvider above it.").toThrow()
})
