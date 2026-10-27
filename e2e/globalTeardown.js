export default async function globalTeardown() {
  const server = globalThis.__devCodesE2eViteServer
  if (!server) return
  await server.close()
  delete globalThis.__devCodesE2eViteServer
}
