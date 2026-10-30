// Verifies that all brown-* and yellow-* shades used across components exist in tailwind.config.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Read tailwind.config.js to find defined shades
const configPath = path.join(rootDir, 'tailwind.config.js');
const configContent = fs.readFileSync(configPath, 'utf-8');

function extractDefinedShades(colorName) {
  const regex = new RegExp(`${colorName}:\\s*\\{([\\s\\S]*?)\\}`, 'm');
  const match = configContent.match(regex);
  if (!match) return new Set();
  const block = match[1];
  const shades = new Set();
  const shadeRegex = /(\d+):\s*['"]#[0-9a-fA-F]+['"]/g;
  let m;
  while ((m = shadeRegex.exec(block)) !== null) {
    shades.add(m[1]);
  }
  return shades;
}

const definedBrown = extractDefinedShades('brown');
const definedYellow = extractDefinedShades('yellow');

console.log(`Defined brown shades: ${Array.from(definedBrown).join(', ')}`);
console.log(`Defined yellow shades: ${Array.from(definedYellow).join(', ')}`);

// Recursively scan src folder for used shades
function scanFiles(dir, fileList = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanFiles(fullPath, fileList);
    } else if (/\.(tsx|ts|html)$/.test(item)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const files = scanFiles(path.join(rootDir, 'src'));
files.push(path.join(rootDir, 'index.html'));

let hasError = false;
const colorRegex = /\b(brown|yellow)-(\d+)\b/g;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf-8');
  let match;
  while ((match = colorRegex.exec(content)) !== null) {
    const color = match[1];
    const shade = match[2];
    const definedSet = color === 'brown' ? definedBrown : definedYellow;

    if (!definedSet.has(shade)) {
      console.error(`Error: Undefined class '${color}-${shade}' used in ${path.relative(rootDir, file)}`);
      hasError = true;
    }
  }
}

if (hasError) {
  console.error('\nBuild failed: Found undefined brown or yellow color shades in components.');
  process.exit(1);
} else {
  console.log('✔ All theme color shades verified successfully.');
}

