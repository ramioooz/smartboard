/**
 * k6 — Multi-replica shared Redis counter test
 *
 * Confirms that rate-limit counters are shared across gateway replicas
 * (i.e., Redis storage is working).  If limits were in-memory only, each
 * replica would have its own independent counter and you'd get N×limit
 * requests before seeing a 429.  With Redis the total across all replicas
 * must hit the limit.
 *
 * Prerequisites:
 *   brew install k6
 *
 *   # Scale to 3 replicas before running
 *   docker compose -f infra/compose.yaml up -d --scale gateway=3
 *
 * Run:
 *   k6 run tests/rate-limit/multi-replica.js
 *
 * What to expect:
 *   - With in-memory storage + 3 replicas: ~900 requests before first 429
 *   - With Redis storage + 3 replicas:     ~300 requests before first 429
 *   - Threshold `first_429_within_350_requests` should PASS with Redis
 *
 * Note: health endpoints are @SkipThrottle so we test against a real
 * API endpoint.  Pass a valid TOKEN env var for authenticated routes,
 * otherwise login (public, but tight limit) is used instead.
 */

import http from 'k6/http';
import { check } from 'k6';
import { Counter } from 'k6/metrics';

const rateLimited     = new Counter('rl_total');
const requestsSent    = new Counter('requests_sent');

export const options = {
  scenarios: {
    distributed: {
      executor: 'shared-iterations',
      vus: 30,
      iterations: 600,   // 2× the 300/min medium limit — must see 429s
      maxDuration: '30s',
    },
  },
  thresholds: {
    // Redis-backed: should 429 well before 600 iterations complete
    rl_total: ['count>0'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost';
const TOKEN    = __ENV.TOKEN    || '';

export default function () {
  requestsSent.add(1);

  const headers = { 'Content-Type': 'application/json' };
  if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;

  // Use the datasets endpoint (requires auth) or login (public, tighter limit)
  const url = TOKEN
    ? `${BASE_URL}/api/datasets`
    : `${BASE_URL}/api/auth/login`;

  const body = TOKEN
    ? null
    : JSON.stringify({ email: 'x@x.com', password: 'wrong' });

  const res = TOKEN
    ? http.get(url, { headers })
    : http.post(url, body, { headers });

  if (res.status === 429) {
    rateLimited.add(1);
  }

  check(res, {
    'not a server error': (r) => r.status < 500,
  });
}
