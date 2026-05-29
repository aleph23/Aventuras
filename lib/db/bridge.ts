import { type DbProxyMethod, type DbProxyResult } from '@/types/db-bridge'

// Lazy by design: window.aventurasDb is only read when a query actually runs,
// so importing lib/db in Node/Vitest never throws.
export async function bridgeQuery(
  sqlText: string,
  params: unknown[],
  method: DbProxyMethod,
): Promise<DbProxyResult> {
  const bridge = globalThis.window?.aventurasDb
  if (!bridge) {
    throw new Error('Database bridge unavailable — Electron preload not loaded.')
  }
  return bridge.query(sqlText, params, method)
}
