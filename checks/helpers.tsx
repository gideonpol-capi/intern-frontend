// Shared helpers for the task checks. You don't need to change anything here.
import { render } from "@testing-library/react"
import { Fragment, useEffect, type ComponentType, type ReactNode } from "react"
import { MemoryRouter, useLocation } from "react-router-dom"

const files = import.meta.glob("/src/**/*.{ts,tsx}")

export function exists(file: string) {
  return `/${file}` in files
}

/** An export of one of your files, with a clear message when the file or the export is missing. */
export async function load<T>(file: string, name = "default"): Promise<T> {
  const importer = files[`/${file}`]
  if (!importer) throw new Error(`${file} does not exist yet. Create it as the task describes.`)
  const module = (await importer()) as Record<string, unknown>
  if (!(name in module)) {
    const what = name === "default" ? "a default export" : `an export called ${name}`
    throw new Error(`${file} has no ${what}. Check the name in the task.`)
  }
  return module[name] as T
}

type Wrapper = ComponentType<{ children?: ReactNode }>

/** Your Chakra Provider from Task 2 on, nothing before that. */
async function chakra(): Promise<Wrapper> {
  return exists("src/components/ui/provider.tsx")
    ? load<Wrapper>("src/components/ui/provider.tsx", "Provider")
    : Fragment
}

/** Renders one of your components inside your Chakra Provider and a router. */
export async function renderUi(ui: ReactNode) {
  const Provider = await chakra()
  return render(
    <Provider>
      <MemoryRouter>{ui}</MemoryRouter>
    </Provider>,
  )
}

/**
 * Renders your whole app at `path`, the way main.tsx does, but with a router the checks control.
 * `user` is put in localStorage first, so the app starts logged in.
 * Read the current URL from the returned object: `app.path`; `app.visited` lists every URL it went through.
 */
export async function renderApp(path: string, user?: Record<string, string>) {
  if (user) localStorage.setItem("user", JSON.stringify(user))
  const App = await load<ComponentType>("src/App.tsx")
  const AuthProvider = await load<Wrapper>("src/context/AuthContext.tsx", "AuthProvider")
  const Provider = await chakra()
  const app = { path, visited: [path] }
  function Probe() {
    const { pathname } = useLocation()
    useEffect(() => {
      app.path = pathname
      app.visited.push(pathname)
    }, [pathname])
    return null
  }
  render(
    <Provider>
      <MemoryRouter initialEntries={[path]}>
        <AuthProvider>
          <App />
          <Probe />
        </AuthProvider>
      </MemoryRouter>
    </Provider>,
  )
  return app
}

export const jane = { email: "jane@example.com" }
