export type DbProxyMethod = 'run' | 'all' | 'values' | 'get'
export type DbProxyResult = { rows: unknown[] }

export type DbBridge = {
  query(sql: string, params: unknown[], method: DbProxyMethod): Promise<DbProxyResult>
  exec(sql: string): Promise<void>
  transaction(ops: { sql: string; params: unknown[] }[]): Promise<{ ok: true }>
}
