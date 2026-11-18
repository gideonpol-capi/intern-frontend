// Task 2: Chakra, theme tokens and dark mode.
import { useChakraContext } from "@chakra-ui/react"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { expect, test } from "vitest"
import { jane, load, renderApp, renderUi } from "./helpers"

type Token = { value: string; extensions: { conditions?: { base?: string; _dark?: string } } }
type System = { tokens: { getByName: (name: string) => Token | undefined } }

const system = () => load<System>("src/theme.ts", "system")

// The tokens every later task uses, with their value in the Figma "Tokens" section.
const colors = {
  "bg.page": "#F9FAFB",
  "bg.surface": "#FFFFFF",
  "fg.default": "#0D0D0D",
  "fg.muted": "#808080",
  "border.default": "#F0F0F0",
  "accent.solid": "#C9F8C1",
}

test.each(Object.entries(colors))("color token %s is %s in light mode and has a dark value", async (name, light) => {
  const token = (await system()).tokens.getByName(`colors.${name}`)
  expect(token, `Add ${name} under semanticTokens.colors in src/theme.ts.`).toBeDefined()
  const { base, _dark } = token!.extensions.conditions ?? {}
  expect(base?.toUpperCase(), `${name} should be ${light} in light mode, like the Figma.`).toBe(light)
  expect(_dark, `Give ${name} a _dark value: { value: { base: "${light}", _dark: "…" } }.`).toBeTruthy()
})

test.each(["bg.page", "bg.surface", "fg.default"])("%s changes in dark mode", async (name) => {
  const { base, _dark } = (await system()).tokens.getByName(`colors.${name}`)?.extensions.conditions ?? {}
  expect(_dark?.toUpperCase(), `${name} needs a different color in dark mode.`).not.toBe(base?.toUpperCase())
})

test.each([
  ["card", "24px"],
  ["control", "8px"],
])("radius token %s is %s", async (name, value) => {
  const token = (await system()).tokens.getByName(`radii.${name}`)
  expect(token?.value, `Add radii.${name} = ${value} under tokens in src/theme.ts.`).toBe(value)
})

test("the Provider uses your theme", async () => {
  const expected = await system()
  let used: unknown
  function Probe() {
    used = useChakraContext()
    return null
  }
  await renderUi(<Probe />)
  expect(used === expected, "Pass your system to ChakraProvider in src/components/ui/provider.tsx.").toBe(true)
})

const sources = import.meta.glob<string>("/src/{components,pages}/**/*.tsx", {
  query: "?raw",
  import: "default",
  eager: true,
})
const yours = Object.entries(sources).filter(([file]) => !file.startsWith("/src/components/ui/"))

test("components and pages use tokens, not raw colors", () => {
  for (const [file, source] of yours) {
    const raw = source.match(/["'`]#[0-9a-f]{3,8}["'`]|\b(?:rgba?|hsla?)\(/i)
    expect(raw?.[0], `${file} contains a raw color. Add it to the theme and use the token name.`).toBeUndefined()
  }
})

test("no _dark inside components and pages", () => {
  for (const [file, source] of yours) {
    expect(source.includes("_dark"), `${file} uses _dark. Dark colors belong in the theme.`).toBe(false)
  }
})

test("the dashboard has a working dark mode toggle", async () => {
  await renderApp("/dashboard", jane)
  const toggle = await screen.findByRole("button", { name: /colou?r mode|dark mode|theme/i })
  const wasDark = document.documentElement.classList.contains("dark")
  await userEvent.click(toggle)
  await waitFor(() => expect(document.documentElement.classList.contains("dark")).toBe(!wasDark))
})
