/**
 * Centralised access point for all NEXT_PUBLIC_* environment variables.
 *
 * NEXT_PUBLIC_* vars are baked into the client bundle at build time by Next.js.
 * We validate lazily (inside the function) rather than at module load time so
 * that static-site generation doesn't throw before the build env is available.
 */

export function getGatewayUrl(): string {
  const url = process.env.NEXT_PUBLIC_GATEWAY_URL;
  if (!url) throw new Error('Missing required environment variable: NEXT_PUBLIC_GATEWAY_URL');
  return url;
}
