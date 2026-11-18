// Task 9: dashboard, charts and aggregates.
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, test } from "vitest"
import { exists, jane, load, renderApp } from "./helpers"

type Order = { id: string; date: string; customer: string; category: string; status: string; amount: number }
const orders = () => load<Order[]>("src/data/orders.ts", "orders")

function daysAgo(n: number) {
  const date = new Date()
  date.setDate(date.getDate() - n)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

describe("aggregate functions", () => {
  const rows = [
    { category: "Hardware", amount: 100 },
    { category: "Software", amount: 50 },
    { category: "Hardware", amount: 25 },
  ]

  test("sumBy adds up a number per item", async () => {
    type SumBy = <T>(items: T[], value: (item: T) => number) => number
    const sumBy = await load<SumBy>("src/utils/aggregate.ts", "sumBy")
    expect(sumBy(rows, (r) => r.amount)).toBe(175)
    expect(
      sumBy([], () => 1),
      "The sum of nothing is 0.",
    ).toBe(0)
  })

  test("groupBy puts items in groups by a key", async () => {
    type GroupBy = <T>(items: T[], key: (item: T) => string) => Record<string, T[]>
    const groupBy = await load<GroupBy>("src/utils/aggregate.ts", "groupBy")
    const groups = groupBy(rows, (r) => r.category)
    expect(Object.keys(groups).sort()).toEqual(["Hardware", "Software"])
    expect(groups.Hardware).toEqual([rows[0], rows[2]])
  })

  test("you wrote your own tests for them", () => {
    expect(exists("src/utils/aggregate.test.ts"), "Add src/utils/aggregate.test.ts with your own tests.").toBe(true)
  })
})

test("there are at least 40 orders, all in the last 30 days", async () => {
  const all = await orders()
  expect(all.length, "Add at least 40 orders to src/data/orders.ts.").toBeGreaterThanOrEqual(40)
  for (const order of all) {
    expect(["Hardware", "Software", "Services"]).toContain(order.category)
    expect(["paid", "pending", "refunded"]).toContain(order.status)
    expect(typeof order.amount).toBe("number")
    expect(
      order.date >= daysAgo(29) && order.date <= daysAgo(0),
      `Order ${order.id} is dated ${order.date}. Build the dates from today, so the data never gets old.`,
    ).toBe(true)
  }
})

test("the stat cards are on the dashboard", async () => {
  await renderApp("/dashboard", jane)
  for (const label of [/total revenue/i, /number of orders/i, /average order value/i, /refund rate/i]) {
    expect((await screen.findAllByText(label)).length, `Add a StatCard for ${label.source}.`).toBeGreaterThan(0)
  }
})

test("the period filter recalculates the numbers", async () => {
  const all = await orders()
  const lastWeek = all.filter((o) => o.date >= daysAgo(6)).length
  expect(lastWeek, "Put some orders in the last 7 days, and some before.").toBeLessThan(all.length)
  await renderApp("/dashboard", jane)
  expect(
    (await screen.findAllByText(String(all.length))).length,
    `"Number of orders" shows ${all.length} for the last 30 days.`,
  ).toBeGreaterThan(0)

  const select = screen.getByRole("combobox", { name: /period/i })
  if (select.tagName === "SELECT") {
    await userEvent.selectOptions(select, screen.getByRole("option", { name: /7 days/i }))
  } else {
    await userEvent.click(select)
    await userEvent.click(await screen.findByRole("option", { name: /7 days/i }))
  }
  await waitFor(() =>
    expect(
      screen.queryAllByText(String(lastWeek)).length,
      `After choosing the last 7 days, "Number of orders" shows ${lastWeek}.`,
    ).toBeGreaterThan(0),
  )
})
