import { ApiError } from "@/lib/api";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export type AuthRedirectTarget = "signup" | "login";

export type AuthFail = {
  ok: false;
  error: string;
  code?: string;
  redirectTo?: AuthRedirectTarget;
};

export const AUTH_REDIRECT_DELAY_MS = 2200;

const CODE_REDIRECT: Record<string, AuthRedirectTarget> = {
  ACCOUNT_NOT_FOUND: "signup",
  ACCOUNT_ALREADY_EXISTS: "login",
};

const DUPLICATE_EMAIL_RE = /already exists/i;

function payloadRedirectTo(payload: unknown): AuthRedirectTarget | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const rt = (payload as { redirectTo?: unknown }).redirectTo;
  if (rt === "signup" || rt === "login") return rt;
  return undefined;
}

function isLegacyDuplicateEmail(err: ApiError): boolean {
  if (err.code !== "VALIDATION_ERROR") return false;
  if (DUPLICATE_EMAIL_RE.test(err.message)) return true;
  const field = err.fieldMessage;
  return field ? DUPLICATE_EMAIL_RE.test(field) : false;
}

export function mapAuthError(
  err: unknown,
  fallback = "Something went wrong. Try again.",
): AuthFail {
  if (err instanceof ApiError) {
    let redirectTo =
      payloadRedirectTo(err.payload) ?? CODE_REDIRECT[err.code];

    if (!redirectTo && isLegacyDuplicateEmail(err)) {
      redirectTo = "login";
    }

    return {
      ok: false,
      error: err.message,
      code: err.code,
      ...(redirectTo ? { redirectTo } : {}),
    };
  }
  return { ok: false, error: fallback };
}

export async function authRedirect(
  router: AppRouterInstance,
  path: string,
  opts: { onBeforeNavigate?: () => void } = {},
): Promise<void> {
  opts.onBeforeNavigate?.();
  await new Promise((resolve) => setTimeout(resolve, AUTH_REDIRECT_DELAY_MS));
  router.push(path);
}
