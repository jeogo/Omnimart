import type { NextApiRequest, NextApiResponse } from "next"
import fs from "fs"
import path from "path"

const apiDirs = [
  path.join(process.cwd(), "pages", "api"),
  path.join(process.cwd(), "app", "api"),
]

function getApiFiles(dir: string, base = ""): string[] {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir).flatMap((file) => {
    const fullPath = path.join(dir, file)
    const relPath = path.join(base, file)
    if (fs.statSync(fullPath).isDirectory()) {
      return getApiFiles(fullPath, relPath)
    }
    if (file.endsWith(".ts") || file.endsWith(".js")) {
      return [relPath.replace(/\.(ts|js)$/, "")]
    }
    return []
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const endpoints: string[] = []
  for (const dir of apiDirs) {
    endpoints.push(...getApiFiles(dir))
  }
  // Remove logger endpoint itself
  const filtered = endpoints.filter(e => !e.includes("logger"))
  // Try to fetch data from each endpoint (GET only)
  const results: Record<string, any> = {}
  for (const ep of filtered) {
    try {
      const url = `/api/${ep.replace(/\\/g, "/")}`
      const absUrl = `http://localhost:${process.env.PORT || 3000}${url}`
      const resp = await fetch(absUrl)
      let data
      try {
        data = await resp.json()
      } catch {
        data = await resp.text()
      }
      results[url] = { status: resp.status, data }
    } catch (err) {
      results[`/api/${ep}`] = { error: String(err) }
    }
  }
  res.status(200).json({ endpoints: filtered.map(e => `/api/${e}`), results })
}
