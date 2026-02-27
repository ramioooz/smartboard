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
