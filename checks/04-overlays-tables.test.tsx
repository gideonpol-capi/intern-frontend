// Task 4: Modal, DataTable and ChartCard.
import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ComponentType } from "react"
import { describe, expect, test, vi } from "vitest"
import { jane, load, renderApp, renderUi } from "./helpers"

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the checks don't know your prop types
type Component = ComponentType<any>
const component = (name: string) => load<Component>(`src/components/${name}.tsx`, name)

describe("Modal", () => {
  test("shows nothing while closed", async () => {
    const Modal = await component("Modal")
    await renderUi(
      <Modal open={false} onClose={() => {}} title="Delete Jane Cooper?">
        Body
      </Modal>,
    )
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  test("shows title, body and footer while open", async () => {
    const Modal = await component("Modal")
    await renderUi(
      <Modal open onClose={() => {}} title="Delete Jane Cooper?" footer={<button>Confirm</button>}>
        This can't be undone.
      </Modal>,
    )
    const dialog = await screen.findByRole("dialog", { name: "Delete Jane Cooper?" })
    expect(within(dialog).getByText("This can't be undone.")).toBeTruthy()
    expect(within(dialog).getByRole("button", { name: "Confirm" })).toBeTruthy()
  })

  test("closes with the × button", async () => {
    const Modal = await component("Modal")
    const onClose = vi.fn()
    await renderUi(
      <Modal open onClose={onClose} title="Details">
        Body
      </Modal>,
    )
    await userEvent.click(await screen.findByRole("button", { name: "Close" }))
    await waitFor(() => expect(onClose, 'Give the × an aria-label "Close" and call onClose.').toHaveBeenCalled())
  })

  test("closes with Esc", async () => {
    const Modal = await component("Modal")
    const onClose = vi.fn()
    await renderUi(
      <Modal open onClose={onClose} title="Details">
        Body
      </Modal>,
    )
    await screen.findByRole("dialog")
    await userEvent.keyboard("{Escape}")
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })
})

test("DataTable shows the columns and any React element in a cell", async () => {
  const DataTable = await component("DataTable")
  await renderUi(
    <DataTable
      columns={["User", "Status"]}
      rows={[
        ["Rose Meadows", <strong key="s">In Negotiation</strong>],
        ["Carl Meadows", <strong key="s">Closed - Lost</strong>],
      ]}
    />,
  )
  const table = screen.getByRole("table")
  expect(
    within(table)
      .getAllByRole("columnheader")
      .map((th) => th.textContent),
  ).toEqual(["User", "Status"])
  expect(within(table).getAllByRole("row")).toHaveLength(3)
  expect(within(table).getByText("Closed - Lost").tagName).toBe("STRONG")
})

test("ChartCard shows title, subtitle, actions and the chart", async () => {
  const ChartCard = await component("ChartCard")
  await renderUi(
    <ChartCard title="User Overview" subtitle="+25% compared to last 30 days" actions={<button>This Week</button>}>
      <p>the chart</p>
    </ChartCard>,
  )
  for (const text of ["User Overview", "+25% compared to last 30 days", "the chart"]) {
    expect(screen.getByText(text)).toBeTruthy()
  }
  expect(screen.getByRole("button", { name: "This Week" })).toBeTruthy()
})

test("/components shows the table too", async () => {
  await renderApp("/components", jane)
  expect(await screen.findByRole("table"), "Add a filled-in DataTable to the components page.").toBeTruthy()
})
