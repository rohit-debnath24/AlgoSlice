const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local manually to avoid dotenv dependency
const envPath = path.resolve(process.cwd(), '.env.local');

console.log('Checking environment file at:', envPath);

if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local file not found!');
    process.exit(1);
}

const content = fs.readFileSync(envPath, 'utf-8');
const envConfig = {};

// Simple parser
content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
        const parts = trimmed.split('=');
        const key = parts[0];
        // Handle value potentially containing =
        const value = parts.slice(1).join('=');
        if (key && value) {
            envConfig[key.trim()] = value.trim();
        }
    }
});

console.log('\n--- GitHub App Credentials Check ---');

// Check App ID
const appId = envConfig.GITHUB_APP_ID;
if (!appId) {
    console.error('❌ GITHUB_APP_ID is missing');
} else {
    console.log(`✅ GITHUB_APP_ID is present (Value: ${appId})`);
}

// Check Private Key
let privateKey = envConfig.GITHUB_APP_PRIVATE_KEY;
if (!privateKey) {
    console.error('❌ GITHUB_APP_PRIVATE_KEY is missing');
} else {
    console.log('✅ GITHUB_APP_PRIVATE_KEY is present');
    console.log(`   Raw Length: ${privateKey.length} characters`);

    // Check if it's quoted
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
        console.log('ℹ️  Key is quoted, stripped quotes.');
    } else if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
        privateKey = privateKey.slice(1, -1);
        console.log('ℹ️  Key is quoted, stripped quotes.');
    }

    // Check for literal \n
    const hasLiteralNewlines = privateKey.includes('\\n');
    console.log(`   Has literal \\n characters: ${hasLiteralNewlines}`);

    // Check header
    if (!privateKey.includes('BEGIN') && !privateKey.includes('END')) {
        // Maybe base64?
        try {
            const decoded = Buffer.from(privateKey, 'base64').toString('utf-8');
            if (decoded.includes('BEGIN')) {
                console.log('✅ Key is Base64 encoded and decodes correctly.');
                privateKey = decoded;
            } else {
                console.warn('⚠️ Key does not contain BEGIN/END header and is not valid Base64 encoded PEM.');
            }
        } catch (e) {
            console.warn('⚠️ Key does not contain BEGIN/END header.');
        }
    } else {
        console.log('✅ Key contains PEM headers.');
    }

    // Simulation of processing
    let processedKey = privateKey;
    if (hasLiteralNewlines) {
        processedKey = processedKey.replace(/\\n/g, '\n');
    }

    const lines = processedKey.split('\n');
    console.log(`   Processed Key Line Count: ${lines.length}`);

    if (lines.length < 2) {
        console.error('❌ Warning: Processed key still seems to have only 1 line. GitHub usually requires PEM format with multiple lines.');
    } else {
        console.log('✅ Key format looks correct (multiline).');
    }

    // Test JWT Signing
    console.log('\n--- Testing Crypto Signing ---');
    try {
        const jwt = require('jsonwebtoken');
        const now = Math.floor(Date.now() / 1000);
        const payload = {
            iat: now,
            exp: now + 60,
            iss: appId
        };
        const token = jwt.sign(payload, processedKey, { algorithm: 'RS256' });
        if (token) {
            console.log('✅ JWT Signing Verification Passed. Token generated successfully.');
        } else {
            console.error('❌ JWT Signing produced empty token.');
        }
    } catch (error) {
        console.error('❌ JWT Signing Failed:', error.message);
        if (error.message.includes('routines:OPENSSL_internal:KEY_VALUES_MISMATCH')) {
            console.error('   Hint: This often means the key format is invalid or corrupted.');
        }
    }
}

console.log('\n--- End Check ---\n');
