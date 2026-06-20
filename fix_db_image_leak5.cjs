const fs = require('fs');
let content = fs.readFileSync('src/lib/services/database.ts', 'utf8');

content = content.replace(
  `async getBackgroundForBranch(storyId: string, branchId: string | null): Promise<string | null> {
    const db = await this.getDb()
    const results = await db.select<{ image_data: string }[]>(
      'SELECT image_data FROM background_images WHERE story_id = ? AND branch_id IS ? AND checkpoint_id IS NULL ORDER BY created_at DESC LIMIT 1',
      [storyId, branchId],
    )
    if (results.length > 0 && results[0].image_data) {
      const base64 = await imageStorageService.loadImage(results[0].image_data)
      return base64 || results[0].image_data
    }
    return null
  }`,
  `async getBackgroundForBranch(storyId: string, branchId: string | null): Promise<string | null> {
    const db = await this.getDb()
    const results = await db.select<{ image_data: string }[]>(
      'SELECT image_data FROM background_images WHERE story_id = ? AND branch_id IS ? AND checkpoint_id IS NULL ORDER BY created_at DESC LIMIT 1',
      [storyId, branchId],
    )
    if (results.length > 0 && results[0].image_data) {
      const base64 = await imageStorageService.loadImage(results[0].image_data)
      if (base64) return base64
      // Fallback only if it still looks like legacy data URL
      if (results[0].image_data.startsWith('data:') || results[0].image_data.length > 1000) {
        return results[0].image_data
      }
    }
    return null
  }`
);

content = content.replace(
  `async getBackgroundForCheckpoint(storyId: string, checkpointId: string): Promise<string | null> {
    const db = await this.getDb()
    const results = await db.select<{ image_data: string }[]>(
      'SELECT image_data FROM background_images WHERE story_id = ? AND checkpoint_id = ? LIMIT 1',
      [storyId, checkpointId],
    )
    if (results.length > 0 && results[0].image_data) {
      const base64 = await imageStorageService.loadImage(results[0].image_data)
      return base64 || results[0].image_data
    }
    return null
  }`,
  `async getBackgroundForCheckpoint(storyId: string, checkpointId: string): Promise<string | null> {
    const db = await this.getDb()
    const results = await db.select<{ image_data: string }[]>(
      'SELECT image_data FROM background_images WHERE story_id = ? AND checkpoint_id = ? LIMIT 1',
      [storyId, checkpointId],
    )
    if (results.length > 0 && results[0].image_data) {
      const base64 = await imageStorageService.loadImage(results[0].image_data)
      if (base64) return base64
      // Fallback only if it still looks like legacy data URL
      if (results[0].image_data.startsWith('data:') || results[0].image_data.length > 1000) {
        return results[0].image_data
      }
    }
    return null
  }`
);

fs.writeFileSync('src/lib/services/database.ts', content);

let content2 = fs.readFileSync('src/lib/services/image/ImageStorageService.ts', 'utf8');

content2 = content2.replace(
  `const filename = \`\${id}.png\``,
  `// Infer extension from base64 data URL if present, otherwise default to png
    let ext = 'png'
    if (base64Data.startsWith('data:image/')) {
        const match = base64Data.match(/data:image\\/([a-zA-Z0-9]+);/)
        if (match && match[1]) {
            ext = match[1]
            // Standardize some extensions
            if (ext === 'jpeg') ext = 'jpg'
        }
    }
    const filename = \`\${id}.\${ext}\``
);

content2 = content2.replace(
  `if (filename.startsWith('data:') || filename.length > 1000 || !filename.endsWith('.png')) {
        return filename.startsWith('data:') ? filename : \`data:image/png;base64,\${filename}\`
    }`,
  `if (filename.startsWith('data:') || filename.length > 1000 || !filename.match(/\\.(png|jpg|jpeg|webp|gif)$/i)) {
        return filename.startsWith('data:') ? filename : \`data:image/png;base64,\${filename}\`
    }`
);

content2 = content2.replace(
  `return \`data:image/png;base64,\${this.bytesToBase64(bytes)}\``,
  `const ext = filename.split('.').pop()?.toLowerCase() || 'png'
        const mimeType = ext === 'jpg' ? 'jpeg' : ext
        return \`data:image/\${mimeType};base64,\${this.bytesToBase64(bytes)}\``
);

content2 = content2.replace(
  `if (!filename || filename.length > 1000 || filename.startsWith('data:') || !filename.endsWith('.png')) {`,
  `if (!filename || filename.length > 1000 || filename.startsWith('data:') || !filename.match(/\\.(png|jpg|jpeg|webp|gif)$/i)) {`
);

fs.writeFileSync('src/lib/services/image/ImageStorageService.ts', content2);
