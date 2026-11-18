// Task 7: products, a responsive card grid.
import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ComponentType } from "react"
import { expect, test, vi } from "vitest"
import { jane, load, renderApp, renderUi } from "./helpers"

type Product = { id: string; title: string; imageUrl: string; link: string }
const products = () => load<Product[]>("src/data/products.ts", "products")

test("there are at least 12 mock products", async () => {
  const all = await products()
  expect(all.length, "Add at least 12 products to src/data/products.ts.").toBeGreaterThanOrEqual(12)
  for (const product of all) {
    for (const key of ["id", "title", "imageUrl", "link"] as const) {
      expect(product[key], `Every product needs a ${key}.`).toBeTruthy()
    }
  }
  expect(new Set(all.map((p) => p.id)).size, "Product ids must be unique.").toBe(all.length)
})

test("ProductCard shows the image, title and a View details button", async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the checks don't know your prop types
  const ProductCard = await load<ComponentType<any>>("src/components/ProductCard.tsx", "ProductCard")
  const onViewDetails = vi.fn()
  await renderUi(
    <ProductCard
      imageUrl="https://picsum.photos/seed/lamp/600/400"
      title="Desk lamp"
      link="https://example.com/lamp"
      status={{ label: "In stock", tone: "green" }}
      onViewDetails={onViewDetails}
    />,
  )
  expect(screen.getByRole("img", { name: "Desk lamp" }), "Give the image the product title as alt text.").toBeTruthy()
  expect(screen.getByText("Desk lamp")).toBeTruthy()
  await userEvent.click(screen.getByRole("button", { name: /view details/i }))
  expect(onViewDetails).toHaveBeenCalledOnce()
})

test("/products shows every product", async () => {
  const all = await products()
  await renderApp("/products", jane)
  for (const product of all) expect((await screen.findAllByText(product.title)).length).toBeGreaterThan(0)
})

test("List View shows the products in a table", async () => {
  const [first] = await products()
  await renderApp("/products", jane)
  const option = (await screen.findAllByText("List View"))[0]
  await userEvent.click(screen.queryByRole("radio", { name: "List View" }) ?? option)
  const table = await screen.findByRole("table")
  expect(within(table).getAllByText(first.title).length).toBeGreaterThan(0)
})

test("View details opens a modal with the product", async () => {
  const [first] = await products()
  await renderApp("/products", jane)
  await userEvent.click((await screen.findAllByRole("button", { name: /view details/i }))[0])
  const dialog = await screen.findByRole("dialog")
  expect(within(dialog).getAllByText(first.title).length).toBeGreaterThan(0)
})
