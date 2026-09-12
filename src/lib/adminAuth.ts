// ─── Admin Authentication Helper ─────────────────────────────────────────────
// Supports flexible, case-insensitive, whitespace-tolerant admin password verification

export const VALID_ADMIN_PASSWORDS = [
  "Nithin@Takevolet2026",
  "Nithin@RoomRelay2026",
  "Takevolet2026",
  "RoomRelay2026",
  "takevolet",
  "takevolt",
  "admin",
  "nithin",
  "roomrelay",
];

export const DEFAULT_ADMIN_PASSWORD = "Nithin@Takevolet2026";

/**
 * Checks if a given password string matches any authorized admin password
 */
export function checkAdminPassword(input?: string | null): boolean {
  if (!input) return false;
  const clean = input.trim().toLowerCase();
  if (!clean) return false;

  if (process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.trim().toLowerCase() === clean) {
    return true;
  }

  return VALID_ADMIN_PASSWORDS.some(p => p.toLowerCase() === clean);
}

/**
 * Verifies an incoming HTTP Request contains a valid admin password in headers
 */
export function verifyAdminRequest(request: Request): boolean {
  const headerPwd = request.headers.get("x-admin-password");
  const authHeader = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const pwd = headerPwd || authHeader;
  return checkAdminPassword(pwd);
}
