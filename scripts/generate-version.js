// Generate a version file at build time
// This is fetched by the PWA to detect new deployments
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const version = {
  version: process.env.RENDER_GIT_COMMIT?.slice(0, 8) || 
           process.env.GIT_COMMIT?.slice(0, 8) || 
           `build-${Date.now()}`,
  buildTime: new Date().toISOString(),
};

const outputPath = join(__dirname, '../public/version.json');
writeFileSync(outputPath, JSON.stringify(version, null, 2));
console.log(`Version file generated: ${version.version}`);
