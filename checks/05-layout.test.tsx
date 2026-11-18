// Task 5: app layout, sidebar and hamburger menu.
import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { expect, test } from "vitest"
import { jane, renderApp } from "./helpers"

const pages = ["Dashboard", "Products", "Users", "Admins", "Components"]
const pathOf = (label: string) => `/${label.toLowerCase()}`

test.each(pages)("%s is a private page inside the layout", async (label) => {
  const app = await renderApp(pathOf(label), jane)
  await waitFor(() => expect(app.path, `Add the private route ${pathOf(label)}.`).toBe(pathOf(label)))
  const nav = (await screen.findAllByRole("navigation"))[0]
  for (const page of pages) {
    expect(within(nav).getByRole("link", { name: page }), `The sidebar needs a link to ${page}.`).toBeTruthy()
  }
  const current = within(nav).getByRole("link", { name: label }).getAttribute("aria-current")
  expect(current, `On ${pathOf(label)}, the ${label} link is active (aria-current="page").`).toBe("page")
})

test("logged out, a page in the layout sends you to /login", async () => {
  const app = await renderApp("/products")
  await waitFor(() => expect(app.path).toBe("/login"))
})

test("the header has logout and the dark mode toggle on every page", async () => {
  const app = await renderApp("/products", jane)
  expect(await screen.findByRole("button", { name: /colou?r mode|dark mode|theme/i })).toBeTruthy()
  await userEvent.click(screen.getByRole("button", { name: /^log ?out$/i }))
  await waitFor(() => expect(app.path).toBe("/login"))
})

test("the hamburger opens the same links in a drawer, and a link closes it", async () => {
  const app = await renderApp("/dashboard", jane)
  await userEvent.click(await screen.findByRole("button", { name: /menu/i }))
  const drawer = await screen.findByRole("dialog")
  for (const page of pages) expect(within(drawer).getByRole("link", { name: page })).toBeTruthy()
  await userEvent.click(within(drawer).getByRole("link", { name: "Users" }))
  await waitFor(() => expect(app.path).toBe("/users"))
  await waitFor(() => expect(screen.queryByRole("dialog"), "Clicking a link closes the drawer.").toBeNull())
})
