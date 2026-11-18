// Task 3: icons and the basic components.
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ComponentType } from "react"
import { describe, expect, test, vi } from "vitest"
import { jane, load, renderApp, renderUi } from "./helpers"

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the checks don't know your prop types
type Component = ComponentType<any>
const component = (name: string) => load<Component>(`src/components/${name}.tsx`, name)

describe("icons", () => {
  test.each(["PlusIcon", "SearchIcon", "UsersIcon", "DotsVerticalIcon", "ChevronDownIcon"])("%s", async (name) => {
    const Icon = await load<Component>("src/components/icons.tsx", name)
    const { container } = await renderUi(<Icon data-testid="icon" />)
    const svg = container.querySelector("svg")
    expect(svg, `${name} should render an <svg>.`).not.toBeNull()
    expect(svg!.getAttribute("width"), `${name}: set width and height to "1em".`).toBe("1em")
    expect(svg!.getAttribute("data-testid"), `${name}: spread {...props} on the <svg>.`).toBe("icon")
    for (const el of container.querySelectorAll("[fill], [stroke]")) {
      for (const attribute of ["fill", "stroke"]) {
        const color = el.getAttribute(attribute)
        if (color === null || color === "none") continue
        expect(color, `${name}: colors become "currentColor".`).toBe("currentColor")
      }
    }
  })
})

describe("AppButton", () => {
  test("shows its children and calls onClick", async () => {
    const AppButton = await component("AppButton")
    const onClick = vi.fn()
    await renderUi(<AppButton onClick={onClick}>Add New User</AppButton>)
    await userEvent.click(screen.getByRole("button", { name: "Add New User" }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  test("disabled does not click", async () => {
    const AppButton = await component("AppButton")
    const onClick = vi.fn()
    await renderUi(
      <AppButton disabled onClick={onClick}>
        Save
      </AppButton>,
    )
    await userEvent.click(screen.getByRole("button", { name: "Save" }))
    expect(onClick).not.toHaveBeenCalled()
  })

  test("has the variants and sizes from Figma", async () => {
    const AppButton = await component("AppButton")
    await renderUi(
      <>
        {["primary", "secondary", "dark"].map((variant) =>
          ["sm", "md"].map((size) => (
            <AppButton key={variant + size} variant={variant} size={size}>
              {variant} {size}
            </AppButton>
          )),
        )}
      </>,
    )
    expect(screen.getAllByRole("button")).toHaveLength(6)
  })

  test("passes other button props through, like type", async () => {
    const AppButton = await component("AppButton")
    await renderUi(<AppButton type="submit">Login</AppButton>)
    expect(screen.getByRole("button", { name: "Login" }).getAttribute("type")).toBe("submit")
  })
})

describe("TextField", () => {
  test("has a label and calls onChange with the new text", async () => {
    const TextField = await component("TextField")
    const onChange = vi.fn()
    await renderUi(<TextField label="Email" placeholder="Email" value="" onChange={onChange} />)
    await userEvent.type(screen.getByLabelText("Email", { selector: "input" }), "j")
    expect(onChange, "onChange receives the text (a string), not the event.").toHaveBeenCalledWith("j")
  })

  test("shows an error", async () => {
    const TextField = await component("TextField")
    await renderUi(<TextField label="Email" value="jane" onChange={() => {}} error="Please enter a valid email" />)
    expect(screen.getByLabelText("Email", { selector: "input" }).getAttribute("aria-invalid")).toBe("true")
    expect(screen.getByText("Please enter a valid email")).toBeTruthy()
  })

  test("password has a show/hide button", async () => {
    const TextField = await component("TextField")
    await renderUi(<TextField label="Password" type="password" value="secret" onChange={() => {}} />)
    const input = screen.getByLabelText("Password", { selector: "input" })
    expect(input.getAttribute("type")).toBe("password")
    await userEvent.click(screen.getByRole("button", { name: /show password/i }))
    expect(input.getAttribute("type"), "After clicking 'Show password' the input shows the text.").toBe("text")
    expect(screen.getByRole("button", { name: /hide password/i })).toBeTruthy()
  })

  test("search has the search icon", async () => {
    const TextField = await component("TextField")
    const { container } = await renderUi(<TextField type="search" placeholder="Search" value="" onChange={() => {}} />)
    expect(screen.getByRole("searchbox")).toBeTruthy()
    expect(container.querySelector("svg"), "Show the SearchIcon in a search field.").not.toBeNull()
  })
})

test("AppSelect calls onChange with the value of the chosen option", async () => {
  const AppSelect = await component("AppSelect")
  const onChange = vi.fn()
  const options = [
    { label: "This Week", value: "week" },
    { label: "This Month", value: "month" },
  ]
  await renderUi(<AppSelect label="Period" options={options} value="week" onChange={onChange} />)
  const select = screen.getByRole("combobox", { name: "Period" })
  if (select.tagName === "SELECT") {
    await userEvent.selectOptions(select, "month")
  } else {
    await userEvent.click(select)
    await userEvent.click(await screen.findByRole("option", { name: "This Month" }))
  }
  expect(onChange).toHaveBeenCalledWith("month")
})

test("SegmentedToggle calls onChange with the clicked option", async () => {
  const SegmentedToggle = await component("SegmentedToggle")
  const onChange = vi.fn()
  await renderUi(
    <SegmentedToggle label="View" options={["Grid View", "List View"]} value="Grid View" onChange={onChange} />,
  )
  const option = screen.queryByRole("radio", { name: "List View" }) ?? screen.getByRole("button", { name: "List View" })
  await userEvent.click(option)
  await waitFor(() => expect(onChange).toHaveBeenCalledWith("List View"))
})

test("StatusBadge shows its label in every tone", async () => {
  const StatusBadge = await component("StatusBadge")
  const tones = ["green", "purple", "red", "gray"]
  await renderUi(
    <>
      {tones.map((tone) => (
        <StatusBadge key={tone} label={`badge ${tone}`} tone={tone} />
      ))}
    </>,
  )
  for (const tone of tones) expect(screen.getByText(`badge ${tone}`)).toBeTruthy()
})

test("UserCell shows the name and email", async () => {
  const UserCell = await component("UserCell")
  await renderUi(<UserCell name="Jane Cooper" email="janecooper@gmail.com" />)
  expect(screen.getByText("Jane Cooper")).toBeTruthy()
  expect(screen.getByText("janecooper@gmail.com")).toBeTruthy()
})

test("Card renders its children", async () => {
  const Card = await component("Card")
  await renderUi(<Card>Inside the card</Card>)
  expect(screen.getByText("Inside the card")).toBeTruthy()
})

test("StatCard shows value, label and change", async () => {
  const StatCard = await component("StatCard")
  await renderUi(<StatCard icon={<span />} value="€500.000" label="Yearly Earnings" change="+20%" />)
  for (const text of ["€500.000", "Yearly Earnings", "+20%"]) expect(screen.getByText(text)).toBeTruthy()
})

test("NavItem is a link that marks the current page", async () => {
  const NavItem = await component("NavItem")
  await renderUi(
    <>
      <NavItem icon={<span />} label="Users" to="/users" active />
      <NavItem icon={<span />} label="Products" to="/products" />
    </>,
  )
  const users = screen.getByRole("link", { name: "Users" })
  expect(users.getAttribute("href")).toBe("/users")
  expect(users.getAttribute("aria-current"), 'The active NavItem gets aria-current="page".').toBe("page")
  expect(screen.getByRole("link", { name: "Products" }).getAttribute("aria-current")).toBeNull()
})

test("/components is a private page", async () => {
  const app = await renderApp("/components", jane)
  await waitFor(() => expect(app.path, "Add a private /components route.").toBe("/components"))
})
