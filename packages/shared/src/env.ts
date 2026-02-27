import { hostname } from 'node:os';

/**
 * Reads a required environment variable and returns its value.
 * Throws a descriptive error at startup if the variable is missing,
 * making misconfiguration immediately visible rather than at request time.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

/**
 * Returns a stable identifier for the running process / container instance.
 *
 * - Docker:      the container ID  (Docker sets HOSTNAME to the short container ID)
 * - Kubernetes:  the pod name      (kubelet sets HOSTNAME to the pod name)
 * - Local / bare-metal: the OS hostname via os.hostname()
 *
 * Use this to tag logs, health-check responses, and response headers so you
 * can tell which replica handled a given request when horizontally scaling.
 */
export function getInstanceId(): string {
  // HOSTNAME is set automatically by Docker and Kubernetes — no config needed.
  // Fall back to os.hostname() for local / bare-metal runs.
  return process.env['HOSTNAME'] ?? hostname();
}
