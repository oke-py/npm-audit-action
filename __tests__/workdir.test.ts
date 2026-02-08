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
  const makeGetInput = (value: string) => {
    return vi.fn().mockReturnValue(value)
  }

  test('returns null when input is empty', () => {
    const getInput = makeGetInput('')
    expect(workdir.getNormalizedWorkingDirectory(getInput)).toBeNull()
    expect(getInput).toHaveBeenCalledWith('working_directory', {
      trimWhitespace: true
    })
  })

  test('trims trailing slash', () => {
    const getInput = makeGetInput('foo/bar/')
    expect(workdir.getNormalizedWorkingDirectory(getInput)).toBe('foo/bar')
  })

  test('throws on invalid directory', () => {
    const getInput = makeGetInput('../secret')
    expect(() => workdir.getNormalizedWorkingDirectory(getInput)).toThrow(
      'Invalid input: working_directory'
    )
  })
})
