/**
 * Forced password change is only for accounts that actually have a local password
 * (staff reset / first login). OAuth-only users have no password — do not send them
 * to /change-password.
 */
export function shouldForcePasswordChange(
  mustChangePassword: boolean | undefined,
  hasPassword: boolean | undefined
): boolean {
  if (!mustChangePassword) return false;
  if (hasPassword === false) return false;
  return true;
}
