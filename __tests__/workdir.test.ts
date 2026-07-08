import * as workdir from '../src/workdir'

describe('isValid', () => {
  test('throws an error if working_directory starts with /', () => {
    expect(workdir.isValid('/usr/local/bin')).toBeFalsy()
  })

  test('throws an error if working_directory starts with ..', () => {
    expect(workdir.isValid('../../etc')).toBeFalsy()
  })

  test('returns true for valid relative directory', () => {
    expect(workdir.isValid('packages/app')).toBeTruthy()
  })
})

describe('getNormalizedWorkingDirectory', () => {
  test('returns null when input is empty', () => {
    expect(workdir.getNormalizedWorkingDirectory('')).toBeNull()
  })

  test('trims trailing slash', () => {
    expect(workdir.getNormalizedWorkingDirectory('foo/bar/')).toBe('foo/bar')
  })

  test('throws on invalid directory', () => {
    expect(() => workdir.getNormalizedWorkingDirectory('../secret')).toThrow(
      'Invalid input: working_directory'
    )
  })
})
