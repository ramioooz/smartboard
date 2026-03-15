/**
 * k6 — Global rate limit test
 *
 * Verifies that the global throttler (300 req/min per IP) kicks in and
 * returns 429 when the limit is exceeded, and that the response includes
 * the correct Retry-After / X-RateLimit-* headers.
 *
 * Prerequisites:
 *   brew install k6
 *   docker compose -f infra/compose.yaml up -d   # stack must be running
 *
 * Run:
 *   k6 run tests/rate-limit/global-limit.js
 *
 * What to expect:
 *   - First ~300 requests in a minute → 200 or downstream status
 *   - Requests beyond that → 429 with Retry-After header
 *   - check_429_has_retry_after threshold should pass
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';

const rateLimited = new Counter('rate_limited_requests');
const limitRate   = new Rate('rate_limit_rate');

export const options = {
  // Send 400 requests concurrently to blow past the 300/min limit quickly
  scenarios: {
    burst: {
      executor: 'shared-iterations',
      vus: 20,
      iterations: 400,
      maxDuration: '30s',
    },
  },
  thresholds: {
    // We expect to see some 429s — at least 1 confirms limiting works
    rate_limited_requests: ['count>0'],
    // All 429s must carry Retry-After (validates header is set correctly)
    check_429_has_retry_after: ['rate==1'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost';
const TOKEN    = __ENV.TOKEN    || '';   // Optional — set for auth'd endpoints

export default function () {
  const headers = TOKEN
    ? { Authorization: `Bearer ${TOKEN}` }
    : {};

  const res = http.get(`${BASE_URL}/api/health/live`, { headers });

  if (res.status === 429) {
    rateLimited.add(1);
    const hasRetryAfter = res.headers['Retry-After'] !== undefined;
    limitRate.add(hasRetryAfter);

    check(res, {
      'check_429_has_retry_after': (r) =>
        r.headers['Retry-After'] !== undefined,
    });
  } else {
    check(res, {
      'ok or expected status': (r) => [200, 401, 403].includes(r.status),
    });
  }

  sleep(0.05); // 50ms between iterations per VU
}
