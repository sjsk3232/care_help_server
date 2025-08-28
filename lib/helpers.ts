export function isEmptyOrSpaces(str?: string | null) {
  if (str === undefined || str === null) return true;
  return String(str).trim().length === 0;
}
