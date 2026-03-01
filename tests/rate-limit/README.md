# Rate Limit Tests

k6 load tests to verify rate limiting at both the **nginx layer** (Layer 1, IP-based) and the **NestJS gateway layer** (Layer 2, Redis-backed per-IP).

## Prerequisites

```bash
brew install k6
docker compose -f infra/compose.yaml up -d   # full stack must be running
```

---

## Tests

### 1. `global-limit.js` — General API rate limit

Sends 400 requests rapidly against `/api/health/live` to blow past the 300 req/min gateway throttle and confirms 429 responses with correct headers.

```bash
k6 run tests/rate-limit/global-limit.js
```

**Pass criteria:**
- At least 1 × 429 observed (`rate_limited_requests > 0`)
- Every 429 includes a `Retry-After` header

---

### 2. `auth-brute-force.js` — Login brute-force protection

Sends 15 login attempts from a single VU (same IP) and confirms the 5-attempt per 15-minute limit triggers a 429.

```bash
k6 run tests/rate-limit/auth-brute-force.js
```

**Pass criteria:**
- At least 1 × 429 on the login endpoint (`login_rate_limited > 0`)
- 429 body is valid JSON with `statusCode: 429`
- 429 includes `Retry-After` header

---

### 3. `multi-replica.js` — Redis shared counter across replicas

Scale the gateway to 3 replicas **before** running this test.  Sends 600 requests spread across 30 VUs and confirms that the 300 req/min medium limit is hit (not 900 = 3 × 300, which would indicate in-memory storage).

```bash
# First scale to 3 replicas
docker compose -f infra/compose.yaml up -d --scale gateway=3

# With an auth token (for a real API endpoint)
TOKEN=$(node scripts/gen-dev-token.mjs | tail -1) \
  k6 run tests/rate-limit/multi-replica.js

# Or without a token (uses login endpoint — tighter 5/15min limit)
k6 run tests/rate-limit/multi-replica.js
```

**Pass criteria:**
- 429s appear well before 600 iterations complete (`rl_total > 0`)

---

## Environment Variables

| Variable   | Default                 | Description                              |
|------------|-------------------------|------------------------------------------|
| `BASE_URL` | `http://localhost`      | Base URL of the stack (nginx port 80)    |
| `TOKEN`    | *(empty)*               | JWT bearer token for authenticated tests |

```bash
# Override base URL (e.g. staging)
BASE_URL=https://staging.example.com TOKEN=eyJ... k6 run tests/rate-limit/global-limit.js
```

---

## Manual curl Tests

### Verify nginx 429 on auth endpoint

```bash
# Fire 20 rapid requests at login — nginx allows burst=5 then 429s
for i in {1..20}; do
  echo -n "Request $i: "
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST http://localhost/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"x@x.com","password":"wrong"}'
done
```

### Inspect rate limit response headers

```bash
curl -i -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"x@x.com","password":"wrong"}'

# Look for:
#   X-RateLimit-Limit-Short: 5
#   X-RateLimit-Remaining-Short: 4
#   Retry-After: 900   (seconds until window resets)
```

### Confirm health endpoints are NOT rate limited

```bash
# Hammer health — should always 200
seq 1 200 | xargs -P 50 -I{} curl -s -o /dev/null -w "%{http_code}\n" \
  http://localhost/health/live | sort | uniq -c
# Expected: 200 × 200  (no 429s)
```
