const crypto = require('crypto');

// Must match src/lib/session.ts EXACTLY so session IDs created on USSD
// can be checked on the website, and vice versa.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateSessionId(len = 6) {
  let out = "";
  const bytes = crypto.randomBytes(len);
  for (let i = 0; i < len; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

function hashSessionId(id) {
  const normalized = id.trim().toUpperCase();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

// Matches the website's "obfuscatePhone" in src/routes/mentors.tsx —
// NOT real encryption, just a deterrent against casual viewing.
// SHA-256(phone + salt) truncated, plus base64(phone) appended.
function obfuscatePhone(phone) {
  const salted = phone + 'fursad-salt';
  const hash = crypto.createHash('sha256').update(salted).digest('hex');
  const b64 = Buffer.from(phone).toString('base64');
  return `enc:${hash.slice(0, 16)}:${b64}`;
}

module.exports = { generateSessionId, hashSessionId, obfuscatePhone, ALPHABET };