/**
 * Generates favicons from tinta-favicon.svg:
 * - PNG 32x32 and 16x16 (Safari and modern browsers)
 * - favicon.ico at src/ (replaces old Westwood icon; copied to site root by build)
 * Run: node scripts/generate-favicon.js
 */
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src', 'assets');
const srcRoot = path.join(__dirname, '..', 'src');
const svgPath = path.join(srcDir, 'tinta-favicon.svg');

async function main() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch (e) {
    console.warn('Install sharp: npm install --save-dev sharp');
    process.exit(0);
  }

  const svg = fs.readFileSync(svgPath);
  const sizes = [32, 16];
  const pngPaths = [];

  for (const size of sizes) {
    const outPath = path.join(srcDir, `favicon-${size}x${size}.png`);
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(outPath);
    pngPaths.push(outPath);
    console.log('Written', outPath);
  }

  try {
    const { default: pngToIco } = await import('png-to-ico');
    const icoBuf = await pngToIco(pngPaths);
    const icoPath = path.join(srcRoot, 'favicon.ico');
    fs.writeFileSync(icoPath, icoBuf);
    console.log('Written', icoPath);
  } catch (e) {
    console.warn('Skipping favicon.ico:', e.message);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
