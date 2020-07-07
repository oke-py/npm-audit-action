import * as child_process from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import {mocked} from 'ts-jest/utils'
import {Audit} from '../src/audit'

jest.mock('child_process')

const audit = new Audit()

describe('run', () => {
  beforeEach(() => {
    mocked(child_process).spawnSync.mockClear()
  })

  test('finds vulnerabilities', () => {
    mocked(child_process).spawnSync.mockImplementation((): any => {
      const stdout = fs.readFileSync(
        path.join(__dirname, 'testdata/audit/error.txt')
      )

      return {
        pid: 100,
        output: [stdout],
        stdout,
        stderr: '',
        status: 1,
        signal: null,
        error: null
      }
    })

    audit.run('low')
    expect(audit.foundVulnerability()).toBeTruthy()
  })

  test('does not find vulnerabilities', () => {
    mocked(child_process).spawnSync.mockImplementation((): any => {
      const stdout = fs.readFileSync(
        path.join(__dirname, 'testdata/audit/success.txt')
      )

      return {
        pid: 100,
        output: [stdout],
        stdout,
        stderr: '',
        status: 0,
        signal: null,
        error: null
      }
    })

    audit.run('low')
    expect(audit.foundVulnerability()).toBeFalsy()
  })

  test('throws an error if error is not null', () => {
    mocked(child_process).spawnSync.mockImplementation((): any => {
      return {
        pid: 100,
        output: '',
        stdout: '',
        stderr: '',
        status: 0,
        signal: null,
        error: new Error('Something is wrong')
      }
    })

    expect.assertions(1)
    const e = new Error('Something is wrong')
    expect(() => audit.run('low')).toThrowError(e)
  })

  test('throws an error if status is null', () => {
    mocked(child_process).spawnSync.mockImplementation((): any => {
      return {
        pid: 100,
        output: '',
        stdout: '',
        stderr: '',
        status: null,
        signal: 'SIGTERM',
        error: null
      }
    })

    expect.assertions(1)
    const e = new Error('the subprocess terminated due to a signal.')
    expect(() => audit.run('low')).toThrowError(e)
  })

  test('throws an error if stderr is null', () => {
    mocked(child_process).spawnSync.mockImplementation((): any => {
      return {
        pid: 100,
        output: '',
        stdout: '',
        stderr: 'Something is wrong',
        status: 1,
        signal: null,
        error: null
      }
    })

    expect.assertions(1)
    const e = new Error('Something is wrong')
    expect(() => audit.run('low')).toThrowError(e)
  })
})
