// Runs before every check. You don't need to change anything here.
import { cleanup } from "@testing-library/react"
import { afterEach, beforeEach, vi } from "vitest"

declare global {
  var checksSetup: boolean | undefined
}
globalThis.checksSetup = true

// Typing into a form takes a while in the fake browser, more so when all checks run at once.
vi.setConfig({ testTimeout: 15_000 })

// Browser features the test browser (jsdom) lacks, but Chakra, next-themes and Recharts expect.
window.matchMedia ??= (query: string) =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  }) as MediaQueryList
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Element.prototype.scrollTo ??= () => {}

beforeEach(() => localStorage.clear())
afterEach(() => cleanup())
