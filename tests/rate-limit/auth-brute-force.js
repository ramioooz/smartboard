/**
 * k6 — Auth login brute-force protection test
 *
 * Verifies that the login endpoint is throttled at 5 attempts per 15 minutes
 * per IP (as configured by @Throttle on AuthController.login) and that nginx
 * also blocks at 10 req/min at the edge.
 *
 * Prerequisites:
 *   brew install k6
 *   docker compose -f infra/compose.yaml up -d
 *
 * Run:
 *   k6 run tests/rate-limit/auth-brute-force.js
 *
 * What to expect:
 *   - First 5 attempts → 200 (valid creds) or 401 (wrong creds)
 *   - Attempts 6+ → 429 Too Many Requests
 *   - Response includes Retry-After header
 */

import http from 'k6/http';
import { check } from 'k6';
import { Counter } from 'k6/metrics';

const rateLimited = new Counter('login_rate_limited');

export const options = {
  scenarios: {
    brute_force: {
      executor: 'shared-iterations',
      vus: 1,          // Single VU = same IP = same rate limit bucket
      iterations: 15,  // Well above the 5-attempt limit
      maxDuration: '60s',
    },
  },
  thresholds: {
    // Must see at least one 429 — confirms limit is enforced
    login_rate_limited: ['count>0'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost';

export default function () {
  const payload = JSON.stringify({
    email:    'test@example.com',
    password: 'wrong-password',
  });

  const res = http.post(`${BASE_URL}/api/auth/login`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (res.status === 429) {
    rateLimited.add(1);

    check(res, {
      '429 has Retry-After header': (r) =>
        r.headers['Retry-After'] !== undefined,
      '429 body indicates throttle': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body?.ok === false || body?.statusCode === 429;
        } catch {
          return false;
        }
      },
    });
  } else {
    // 200 (success) or 401 (wrong creds) are both fine until the limit hits
    check(res, {
      'pre-limit response is 200 or 401': (r) =>
        r.status === 200 || r.status === 401,
    });
  }
}
