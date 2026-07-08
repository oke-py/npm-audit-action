export function isValid(dir: string): boolean {
  return !dir.startsWith('/') && !dir.startsWith('..')
}

export function getNormalizedWorkingDirectory(
  workingDirectory: string
): string | null {
  if (!workingDirectory) {
    return null
  }

  const normalizedWorkingDirectory = workingDirectory.endsWith('/')
    ? workingDirectory.slice(0, -1)
    : workingDirectory

  if (!isValid(normalizedWorkingDirectory)) {
    throw new Error('Invalid input: working_directory')
  }

  return normalizedWorkingDirectory
}
