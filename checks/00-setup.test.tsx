// Setup: the Vite project and the tools the checks need.
import type { ComponentType } from "react"
import { expect, test } from "vitest"
import lint from "../.oxlintrc.json"
import pkg from "../package.json"

const installed: Record<string, string> = { ...pkg.dependencies, ...pkg.devDependencies }

test.each([
  "react",
  "react-dom",
  "vite",
  "typescript",
  "vitest",
  "jsdom",
  "@testing-library/react",
  "@testing-library/dom",
  "@testing-library/user-event",
])("%s is installed", (name) => {
  expect(installed[name], `${name} is missing from package.json (steps 3 and 5).`).toBeTruthy()
})

test("the checks run in a fake browser, with checks/setup.ts", () => {
  expect(typeof document, 'Set test.environment to "jsdom" in vite.config.ts (step 6).').toBe("object")
  expect(globalThis.checksSetup, 'Add setupFiles: ["checks/setup.ts"] under test in vite.config.ts (step 6).').toBe(true)
})

test("@/ points to src/", async () => {
  const app = await import("./alias").catch(() => null)
  expect(app, 'Add the "@" alias to vite.config.ts (step 6).').not.toBeNull()
})

test("src/App.tsx exports App", async () => {
  const files = import.meta.glob<{ default?: ComponentType }>("/src/App.tsx")
  expect(files["/src/App.tsx"], "src/App.tsx is missing (step 3).").toBeDefined()
  const App = (await files["/src/App.tsx"]()).default
  expect(typeof App, "src/App.tsx needs a default export: export default function App() { … }").toBe("function")
})

test("the linter refuses any", () => {
  const rules: Record<string, unknown> = lint.rules
  expect(rules["typescript/no-explicit-any"], 'Add "typescript/no-explicit-any": "error" to .oxlintrc.json (step 7).').toBe(
    "error",
  )
})
