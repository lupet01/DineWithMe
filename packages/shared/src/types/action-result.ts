// Canonical result type for server actions. Previously redefined ~26 times
// across apps/web in slightly divergent shapes (a boolean-flag `{ success;
// data?; error? }` and a couple of discriminated unions); this is the single
// source of truth. It uses the boolean-flag shape the vast majority of the
// codebase was written against — data/error stay optional so existing
// consumers (`if (!res.success || !res.data) { setError(res.error) }`) keep
// working — plus the optional `fieldErrors` the onboarding/edit forms rely on.
export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

// Standard failure for an action's catch block (audit finding M10). Logs the
// real error server-side and returns a generic, user-safe message — instead
// of leaking `error.message` (often raw DB/Prisma internals) to the client.
// The return type is assignable to any ActionResult<T> failure branch.
export function actionFailure(
  error: unknown,
  userMessage: string
): { success: false; error: string } {
  console.error("[action error]", error);
  return { success: false, error: userMessage };
}
