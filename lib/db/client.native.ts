import { drizzle } from 'drizzle-orm/expo-sqlite'
import { bundledExtensions, openDatabaseSync } from 'expo-sqlite'

import { dbSchema } from './schema'

const expoDb = openDatabaseSync('aventuras.db')
expoDb.execSync('PRAGMA foreign_keys = ON;')

// sqlite-vec at client init. No M1 feature uses vectors yet, so a failed load
// is non-fatal (logger lands in 1.3).
try {
  const ext = bundledExtensions['sqlite-vec']
  if (!ext) {
    throw new Error('sqlite-vec not bundled (enable withSQLiteVecExtension)')
  }
  expoDb.loadExtensionSync(ext.libPath, ext.entryPoint)
} catch (err) {
  console.warn('sqlite-vec load failed (non-fatal in M1):', err)
}

export const db = drizzle(expoDb, { schema: dbSchema })
