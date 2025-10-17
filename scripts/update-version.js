#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Get current package.json
const packagePath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Parse current version
const [major, minor, patch] = packageJson.version.split('.').map(Number);

// Determine bump type from command line argument
const bumpType = process.argv[2] || 'patch';

let newVersion;
switch (bumpType) {
    case 'major':
        newVersion = `${major + 1}.0.0`;
        break;
    case 'minor':
        newVersion = `${major}.${minor + 1}.0`;
        break;
    case 'patch':
    default:
        newVersion = `${major}.${minor}.${patch + 1}`;
        break;
}

console.log(`🔄 Updating version from ${packageJson.version} to ${newVersion}`);

// Update package.json
packageJson.version = newVersion;
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');

// Update manifest.json
const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.version = newVersion;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
    console.log(`📱 Updated manifest.json to version ${newVersion}`);
}

console.log(`📦 Updated package.json to version ${newVersion}`);

// Build the app
console.log(`🏗️  Building app...`);
try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log(`✅ Build successful! New service worker generated.`);
} catch (error) {
    console.error(`❌ Build failed:`, error.message);
    process.exit(1);
}

// Git commit if in a git repo
try {
    execSync('git add package.json public/manifest.json', { stdio: 'pipe' });
    execSync(`git commit -m "chore: bump version to ${newVersion}"`, { stdio: 'inherit' });
    console.log(`📝 Git commit created for version ${newVersion}`);
} catch (error) {
    console.log(`ℹ️  No git commit created (not in a git repo or no changes)`);
}

console.log(`🎉 Version update complete!`);
console.log(`
📋 Next steps:
1. Deploy the dist/ folder to your web server
2. Users with the old version will see update notification
3. Test by visiting the app in a browser with the previous version installed

🚀 Current version: ${newVersion}
`);