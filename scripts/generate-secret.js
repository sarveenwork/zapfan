// Generate a secure random secret
// Run with: node scripts/generate-secret.js

const crypto = require('crypto');
const secret = crypto.randomBytes(32).toString('hex');
console.log('\nGenerated SESSION_SECRET:');
console.log(secret);
console.log('\nAdd this to your .env.local file:');
console.log(`SESSION_SECRET=${secret}\n`);
