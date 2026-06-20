const fs = require('fs');

let content = fs.readFileSync('src/lib/services/image/ImageMigrationService.ts', 'utf8');

// Need to update NOT LIKE '%.png' to account for multiple extensions
content = content.replace(
  `NOT LIKE '%.png'`,
  `NOT LIKE '%.png' AND image_data NOT LIKE '%.jpg' AND image_data NOT LIKE '%.webp' AND image_data NOT LIKE '%.gif'`
);
content = content.replace(
  `NOT LIKE '%.png'`,
  `NOT LIKE '%.png' AND image_data NOT LIKE '%.jpg' AND image_data NOT LIKE '%.webp' AND image_data NOT LIKE '%.gif'`
);
content = content.replace(
  `NOT LIKE '%.png'`,
  `NOT LIKE '%.png' AND portrait NOT LIKE '%.jpg' AND portrait NOT LIKE '%.webp' AND portrait NOT LIKE '%.gif'`
);
content = content.replace(
  `NOT LIKE '%.png'`,
  `NOT LIKE '%.png' AND portrait NOT LIKE '%.jpg' AND portrait NOT LIKE '%.webp' AND portrait NOT LIKE '%.gif'`
);

fs.writeFileSync('src/lib/services/image/ImageMigrationService.ts', content);
