/**
 * Application Error Logger
 */
export function reportError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  console.error("[Spark-Agent-Pay Error]", error, context);
}
