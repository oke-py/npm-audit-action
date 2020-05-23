export function isValid(dir: string): boolean {
  return !dir.startsWith('/') && !dir.startsWith('..')
}
