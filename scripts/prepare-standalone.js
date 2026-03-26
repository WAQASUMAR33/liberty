const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        const s = path.join(src, entry.name);
        const d = path.join(dest, entry.name);
        if (entry.isDirectory()) copyDir(s, d);
        else fs.copyFileSync(s, d);
    }
}

const root = path.join(__dirname, '..');
const standaloneDir = path.join(root, '.next', 'standalone');

// .next/static must be served by the standalone server
copyDir(path.join(root, '.next', 'static'), path.join(standaloneDir, '.next', 'static'));
console.log('Copied .next/static');

// public folder assets (images, etc.)
copyDir(path.join(root, 'public'), path.join(standaloneDir, 'public'));
console.log('Copied public');

// .env if present
const envSrc = path.join(root, '.env');
if (fs.existsSync(envSrc)) {
    fs.copyFileSync(envSrc, path.join(standaloneDir, '.env'));
    console.log('Copied .env');
}

// Prisma query engine (native binary — must be a real file, not inside asar)
const engineSrc = path.join(root, 'node_modules', '@prisma', 'engines', 'query_engine-windows.dll.node');
if (fs.existsSync(engineSrc)) {
    const engineDest = path.join(standaloneDir, 'node_modules', '@prisma', 'engines');
    fs.mkdirSync(engineDest, { recursive: true });
    fs.copyFileSync(engineSrc, path.join(engineDest, 'query_engine-windows.dll.node'));
    console.log('Copied Prisma engine');
}

console.log('Standalone output ready.');
