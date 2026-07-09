export const TARGET_REGEX = /^[a-zA-Z0-9.:\-\/]+$/;

export function validateTarget(target: string): { valid: boolean; error?: string } {
  if (!TARGET_REGEX.test(target)) {
    return {
      valid: false,
      error: `Target contains invalid characters. Allowed: letters, numbers, dots, colons, hyphens, slashes. Got: "${target.slice(0, 50)}"`,
    };
  }
  return { valid: true };
}
