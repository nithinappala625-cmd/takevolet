const fs = require('fs');
const path = require('path');

// Generate minimal 1x1 gold PNG buffer for icons
// PNG 1x1 hex with gold color (#D4AF37)
const goldPngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAV0lEQVR42u3PMQ0AAAgEMc6/aWxhBxwk0Fd0k6yqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqd8DR/gC8XkS2VwAAAAASUVORK5CYII=";
const buffer = Buffer.from(goldPngBase64, 'base64');

fs.writeFileSync(path.join(__dirname, 'icon16.png'), buffer);
fs.writeFileSync(path.join(__dirname, 'icon48.png'), buffer);
fs.writeFileSync(path.join(__dirname, 'icon128.png'), buffer);

console.log("Icons created successfully!");
