#!/usr/bin/env node
/**
 * Smartboard — Dev Token Generator
 * ─────────────────────────────────
 * Generates a long-lived JWT for local development and Insomnia/cURL testing.
 *
 * The token is signed with the same JWT_SECRET used by the gateway, so it
 * passes the exact same verification code path as production tokens — no auth
 * bypass, no special dev mode. The only difference is a 1-year expiry instead
 * of the default 15 minutes.
 *
 * Usage:
 *   node scripts/gen-dev-token.mjs
 *
 * Prerequisites:
 *   - Stack must be running (docker compose up)
 *   - .env must contain JWT_SECRET
 *
 * Output:
 *   A Bearer token you can paste into Insomnia / cURL and reuse for a year.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import jwt from 'jsonwebtoken';
const { sign } = jwt;

// ── Load JWT_SECRET from .env (without requiring dotenv as a dep) ─────────────
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), '.env');
    const lines = readFileSync(envPath, 'utf-8').split('\n');
    const env = {};
    for (const line of lines) {
      const match = /^([^#=]+)=(.*)$/.exec(line.trim());
      if (match) env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
    }
    return env;
  } catch {
    return {};
  }
}

const env = { ...loadEnv(), ...process.env };
const JWT_SECRET = env['JWT_SECRET'];
const GATEWAY_URL = env['NEXT_PUBLIC_GATEWAY_URL'] ?? 'http://localhost';

if (!JWT_SECRET) {
  console.error('❌  JWT_SECRET not found in .env or environment');
  process.exit(1);
}

// ── Step 1: Login to get the dev user ID ─────────────────────────────────────
console.log(`\n🔑  Logging in as dev@local via ${GATEWAY_URL}/api/auth/login …\n`);

let userId;
try {
  const res = await fetch(`${GATEWAY_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dev@local' }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`❌  Login failed (${res.status}): ${text}`);
    process.exit(1);
  }

  const body = await res.json();
  // Response shape: { ok: true, data: { user: { id, ... }, token: '...' } }
  userId = body?.data?.user?.id ?? body?.data?.id;

  if (!userId) {
    console.error('❌  Could not extract user ID from login response:', JSON.stringify(body));
    process.exit(1);
  }

  console.log(`✅  User ID: ${userId}`);
} catch (err) {
  console.error(`❌  Could not reach gateway at ${GATEWAY_URL}. Is the stack running?`);
  console.error(`    ${err.message}`);
  process.exit(1);
}

// ── Step 2: Sign a 1-year token with the same secret ─────────────────────────
const token = sign(
  { sub: userId },
  JWT_SECRET,
  {
    expiresIn: '1y',
    // Keep the same claim structure as production tokens for identical guard behavior
  },
);

const expiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString();

// ── Step 3: Print results ─────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(70));
console.log('🎫  Dev token (valid until ' + expiry + ')');
console.log('─'.repeat(70));
console.log(token);
console.log('─'.repeat(70));
console.log('\n📋  Insomnia / Postman environment variable:');
console.log(`   Name:  token`);
console.log(`   Value: ${token.slice(0, 40)}…\n`);
console.log('📋  cURL header:');
console.log(`   -H "Authorization: Bearer ${token.slice(0, 40)}…"\n`);
console.log('ℹ️   This token passes the same jwt.verify() check as production.');
console.log('    Regenerate it yearly, or when you change JWT_SECRET.\n');
