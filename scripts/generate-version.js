// Generate a version file at build time
// This is fetched by the PWA to detect new deployments
const { writeFileSync } = require('fs');
const { join } = require('path');

const version = {
  version: process.env.RENDER_GIT_COMMIT?.slice(0, 8) || 
           process.env.GIT_COMMIT?.slice(0, 8) ||
           `build-${Date.now()}`,
  buildTime: new Date().toISOString(),
};

const outputPath = join(__dirname, '..', 'public', 'version.json');
writeFileSync(outputPath, JSON.stringify(version, null, 2));
console.log(`Version file generated: ${version.version}`);
