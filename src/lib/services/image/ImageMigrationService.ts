import { imageStorageService } from './ImageStorageService'
import { database } from '../database'
import { createLogger } from '$lib/log'
import { appDataDir, join } from '@tauri-apps/api/path'
import { exists, writeTextFile } from '@tauri-apps/plugin-fs'

const log = createLogger('ImageMigration')

export class ImageMigrationService {
  /**
   * Migrate all base64 images from the SQLite database to the file system.
   * This is intended to run once on startup.
   */
  async migrateImages(): Promise<void> {
    const appData = await appDataDir()
    const markerFile = await join(appData, 'image_migration_complete.txt')

    if (await exists(markerFile)) {
      log('Image migration already completed. Skipping.')
      return
    }

    log('Starting image migration from database to file system...')
    await imageStorageService.init()

    try {
      const db = await database['getDb']() // Access private db instance through bracket notation

      // 1. Migrate embedded images
      log('Migrating embedded images...')
      const embeddedResults = await db.select<{ id: string; image_data: string }[]>(
        "SELECT id, image_data FROM embedded_images WHERE image_data != '' AND image_data NOT LIKE '%.png'",
      )

      let embeddedCount = 0
      for (const row of embeddedResults) {
        try {
          const filename = await imageStorageService.saveImage(row.id, row.image_data)
          await db.execute('UPDATE embedded_images SET image_data = ? WHERE id = ?', [filename, row.id])
          embeddedCount++
        } catch (e) {
          log('Failed to migrate embedded image', row.id, e)
        }
      }
      log(`Migrated ${embeddedCount} embedded images.`)

      // 2. Migrate background images
      log('Migrating background images...')
      const bgResults = await db.select<{ id: string; image_data: string }[]>(
        "SELECT id, image_data FROM background_images WHERE image_data != '' AND image_data NOT LIKE '%.png'",
      )

      let bgCount = 0
      for (const row of bgResults) {
        try {
          const filename = await imageStorageService.saveImage(`bg_${row.id}`, row.image_data)
          await db.execute('UPDATE background_images SET image_data = ? WHERE id = ?', [filename, row.id])
          bgCount++
        } catch (e) {
          log('Failed to migrate background image', row.id, e)
        }
      }
      log(`Migrated ${bgCount} background images.`)

      // 3. Migrate character portraits
      log('Migrating character portraits...')
      const charResults = await db.select<{ id: string; portrait: string }[]>(
        "SELECT id, portrait FROM characters WHERE portrait IS NOT NULL AND portrait != '' AND portrait NOT LIKE '%.png'",
      )

      let charCount = 0
      for (const row of charResults) {
        try {
          const filename = await imageStorageService.saveImage(`char_${row.id}`, row.portrait)
          await db.execute('UPDATE characters SET portrait = ? WHERE id = ?', [filename, row.id])
          charCount++
        } catch (e) {
          log('Failed to migrate character portrait', row.id, e)
        }
      }
      log(`Migrated ${charCount} character portraits.`)

      // 4. Migrate vault character portraits
      log('Migrating vault character portraits...')
      const vaultCharResults = await db.select<{ id: string; portrait: string }[]>(
        "SELECT id, portrait FROM vault_characters WHERE portrait IS NOT NULL AND portrait != '' AND portrait NOT LIKE '%.png'",
      )

      let vaultCharCount = 0
      for (const row of vaultCharResults) {
        try {
          const filename = await imageStorageService.saveImage(`vault_char_${row.id}`, row.portrait)
          await db.execute('UPDATE vault_characters SET portrait = ? WHERE id = ?', [filename, row.id])
          vaultCharCount++
        } catch (e) {
          log('Failed to migrate vault character portrait', row.id, e)
        }
      }
      log(`Migrated ${vaultCharCount} vault character portraits.`)

      // Mark migration as complete
      await writeTextFile(markerFile, new Date().toISOString())
      log('Image migration completed successfully.')
    } catch (e) {
      log('Fatal error during image migration:', e)
    }
  }
}

export const imageMigrationService = new ImageMigrationService()
