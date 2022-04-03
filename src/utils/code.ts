export function generateAdminCode(): string {
  return `${Math.random().toString(16).substring(2, 8)}${Math.random()
    .toString(16)
    .substring(2, 6)}`;
}
