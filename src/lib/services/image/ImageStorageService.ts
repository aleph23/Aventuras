import { appDataDir, join } from '@tauri-apps/api/path'
import { writeFile, readFile, mkdir, remove, exists } from '@tauri-apps/plugin-fs'

export class ImageStorageService {
  private baseDir: string | null = null

  async init(): Promise<void> {
    if (this.baseDir) return
    const appData = await appDataDir()
    this.baseDir = await join(appData, 'images')
    if (!(await exists(this.baseDir))) {
      await mkdir(this.baseDir, { recursive: true })
    }
  }

  private async getFilePath(filename: string): Promise<string> {
    await this.init()
    return await join(this.baseDir!, filename)
  }

  private base64ToBytes(base64Data: string): Uint8Array {
    const data = base64Data.startsWith('data:') ? base64Data.split(',')[1] : base64Data
    const binaryString = atob(data)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes
  }

  private bytesToBase64(bytes: Uint8Array): string {
    let binary = ''
    // Handle large arrays in chunks to avoid call stack size exceeded
    const chunkSize = 8192
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize)
      binary += String.fromCharCode.apply(null, Array.from(chunk))
    }
    return btoa(binary)
  }

  /**
   * Saves an image and returns the relative filename (e.g., '12345.png')
   */
  async saveImage(id: string, base64Data: string): Promise<string> {
    // If it's already a filename, just return it
    if (base64Data && !base64Data.startsWith('data:') && !base64Data.includes('/')) {
      // Simple heuristic: if it has no slashes and is fairly short, it might be a filename.
      if (base64Data.match(/\.(png|jpg|jpeg|webp)$/i)) {
        return base64Data
      }
    }

    // Some images might be empty or null
    if (!base64Data) {
      return ''
    }

    // Infer extension from base64 data URL if present, otherwise default to png
    let ext = 'png'
    if (base64Data.startsWith('data:image/')) {
      const match = base64Data.match(/data:image\/([a-zA-Z0-9]+);/)
      if (match && match[1]) {
        ext = match[1]
        // Standardize some extensions
        if (ext === 'jpeg') ext = 'jpg'
      }
    }
    const filename = `${id}.${ext}`
    const filePath = await this.getFilePath(filename)

    const bytes = this.base64ToBytes(base64Data)
    await writeFile(filePath, bytes)

    return filename
  }

  /**
   * Loads an image by filename and returns base64 data URL
   */
  async loadImage(filename: string): Promise<string | null> {
    if (!filename) return null

    // If it looks like base64 already, return it
    if (filename.startsWith('data:') || filename.length > 1000 || !filename.endsWith('.png')) {
      return filename.startsWith('data:') ? filename : `data:image/png;base64,${filename}`
    }

    try {
      const filePath = await this.getFilePath(filename)
      if (!(await exists(filePath))) {
        return null
      }
      const bytes = await readFile(filePath)
      const ext = filename.split('.').pop()?.toLowerCase() || 'png'
      const mimeType = ext === 'jpg' ? 'jpeg' : ext
      return `data:image/${mimeType};base64,${this.bytesToBase64(bytes)}`
    } catch (e) {
      console.error('Failed to load image', e)
      return null
    }
  }

  /**
   * Deletes an image by filename
   */
  async deleteImage(filename: string): Promise<void> {
    if (
      !filename ||
      filename.length > 1000 ||
      filename.startsWith('data:') ||
      !filename.match(/\.(png|jpg|jpeg|webp|gif)$/i)
    ) {
      return // Can't delete if it's not a valid filename
    }
    try {
      const filePath = await this.getFilePath(filename)
      if (await exists(filePath)) {
        await remove(filePath)
      }
    } catch (e) {
      console.error('Failed to delete image', e)
    }
  }
}

export const imageStorageService = new ImageStorageService()
