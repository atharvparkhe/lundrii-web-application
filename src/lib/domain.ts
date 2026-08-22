export const INSTITUTE_NAME = "Goa Institute of Management";
export const ALLOWED_DOMAINS = ["@gim.ac.in", "@student.gim.ac.in"] as const;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isAllowedDomain(email: string): boolean {
  const value = normalizeEmail(email);
  if (!value || !value.includes("@")) return false;
  return ALLOWED_DOMAINS.some((d) => value.endsWith(d));
}

export function hostOf(email: string): string | null {
  const trimmed = email.trim();
  const at = trimmed.indexOf("@");
  if (at < 0 || at === trimmed.length - 1) return null;
  return trimmed.slice(at + 1).toLowerCase();
}

export function rejectionLine(email: string, includeAccepted = false): string {
  const host = hostOf(email) ?? "that domain";
  const base = `${host} isn't on ${INSTITUTE_NAME}'s list.`;
  if (!includeAccepted) return base;
  return `${base} Accepted: ${ALLOWED_DOMAINS.join(", ")}`;
}
