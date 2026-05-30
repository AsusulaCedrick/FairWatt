const fs = require('fs');
const path = require('path');

const possiblePaths = [
  path.join(__dirname, '..', 'node_modules', '@expo', 'cli', 'build', 'src', 'start', 'server', 'metro', 'externals.js'),
  path.join(__dirname, '..', 'node_modules', '@expo', 'cli', 'dist', 'src', 'start', 'server', 'metro', 'externals.js'),
];

let filePath = null;
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    filePath = p;
    break;
  }
}

if (!filePath) {
  console.log('Expo CLI node externals patch not needed for this SDK version.');
  process.exit(0);
}

const oldBlock = `const NODE_STDLIB_MODULES = [
    "fs/promises",
    ...(_module.builtinModules || // @ts-expect-error
    (process.binding ? Object.keys(process.binding("natives")) : []) || []).filter((x)=>!/^_|^(internal|v8|node-inspect)\/|\//.test(x) && ![
            "sys"
        ].includes(x)
    ), 
].sort();`;
const newBlock = `const NODE_STDLIB_MODULES = [
    "fs/promises",
    ...new Set((_module.builtinModules || // @ts-expect-error
    (process.binding ? Object.keys(process.binding("natives")) : []) || []).map((x)=>typeof x === "string" ? x.replace(/^node:/, "") : x).filter((x)=>!/^_|^(internal|v8|node-inspect)\/|\//.test(x) && ![
            "sys"
        ].includes(x)
    )), 
].sort();`;

const content = fs.readFileSync(filePath, 'utf8');
if (content.includes(newBlock)) {
  console.log('Expo CLI node externals fix already applied.');
  process.exit(0);
}

if (!content.includes(oldBlock)) {
  console.log('Expo CLI file does not contain the legacy block. No changes needed.');
  process.exit(0);
}

fs.writeFileSync(filePath, content.replace(oldBlock, newBlock), 'utf8');
console.log('Applied Expo CLI node externals patch.');
