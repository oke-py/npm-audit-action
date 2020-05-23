import * as workdir from '../src/workdir'

describe('isValid', () => {
  test('throws an error if working_directory starts with /', () => {
    expect(workdir.isValid('/usr/local/bin')).toBeFalsy()
  })

  test('throws an error if working_directory starts with ..', () => {
    expect(workdir.isValid('../../etc')).toBeFalsy()
  })
})
