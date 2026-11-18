// Task 8: users and admins, a table on desktop and cards on mobile.
import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ComponentType } from "react"
import { expect, test } from "vitest"
import { jane, load, renderApp, renderUi } from "./helpers"

type User = { name: string; email: string }
const data = (name: "users" | "admins") => load<User[]>("src/data/users.ts", name)

test.each(["users", "admins"] as const)("there are at least 10 mock %s", async (name) => {
  const people = await data(name)
  expect(people.length, `Export at least 10 ${name} from src/data/users.ts.`).toBeGreaterThanOrEqual(10)
  for (const person of people) expect(person.name && person.email, "Every row needs a name and an email.").toBeTruthy()
})

test("UserCard shows the user and the actions you pass in", async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the checks don't know your prop types
  const UserCard = await load<ComponentType<any>>("src/components/UserCard.tsx", "UserCard")
  const [user] = await data("users")
  await renderUi(<UserCard user={user} actions={<button>the actions</button>} />)
  expect(screen.getByText(user.name)).toBeTruthy()
  expect(screen.getByText(user.email)).toBeTruthy()
  expect(screen.getByRole("button", { name: "the actions" })).toBeTruthy()
})

test.each(["users", "admins"] as const)("/%s shows every row", async (name) => {
  const people = await data(name)
  await renderApp(`/${name}`, jane)
  for (const person of people) expect((await screen.findAllByText(person.name)).length).toBeGreaterThan(0)
})

test("search filters by name or email", async () => {
  const [first, ...rest] = await data("users")
  const other = rest.find((u) => !`${u.name} ${u.email}`.toLowerCase().includes(first.name.toLowerCase()))!
  await renderApp("/users", jane)
  await userEvent.type(await screen.findByRole("searchbox"), first.name.toUpperCase())
  await waitFor(() =>
    expect(screen.queryAllByText(other.name), "Searching hides rows that don't match.").toHaveLength(0),
  )
  expect(screen.getAllByText(first.name).length, "Search ignores upper and lower case.").toBeGreaterThan(0)
})

async function startDelete(user: User) {
  const name = new RegExp(`actions for ${user.name}`, "i")
  await userEvent.click((await screen.findAllByRole("button", { name }))[0])
  await userEvent.click(await screen.findByRole("menuitem", { name: /delete/i }))
  return screen.findByRole("dialog", { name: `Delete ${user.name}?` })
}

test("Delete asks first; Cancel keeps the row", async () => {
  const [user] = await data("users")
  await renderApp("/users", jane)
  const dialog = await startDelete(user)
  await userEvent.click(within(dialog).getByRole("button", { name: /cancel/i }))
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
  expect(screen.getAllByText(user.name).length).toBeGreaterThan(0)
})

test("confirming Delete removes the row", async () => {
  const [, user] = await data("users")
  await renderApp("/users", jane)
  const dialog = await startDelete(user)
  await userEvent.click(within(dialog).getByRole("button", { name: /^delete$/i }))
  await waitFor(() => expect(screen.queryAllByText(user.name)).toHaveLength(0))
})
