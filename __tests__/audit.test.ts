import * as child_process from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { Audit } from '../src/audit'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

vi.mock('node:child_process')

const audit = new Audit()

describe('run', () => {
  beforeEach(() => {
    vi.mocked(child_process).spawnSync.mockClear()
  })

  test('finds vulnerabilities with default values', () => {
    vi.mocked(child_process).spawnSync.mockImplementation(
      (): child_process.SpawnSyncReturns<string> => {
        const stdout = fs
          .readFileSync(path.join(__dirname, 'testdata/audit/error.txt'))
          .toString()

        return {
          pid: 100,
          output: [null, stdout, ''],
          stdout,
          stderr: '',
          status: 1,
          signal: null,
          error: undefined
        }
      }
    )

    audit.run('low', 'false', 'false')
    expect(audit.foundVulnerability()).toBeTruthy()
  })

  test('finds vulnerabilities with production flag enabled', () => {
    vi.mocked(child_process).spawnSync.mockImplementation(
      (): child_process.SpawnSyncReturns<string> => {
        const stdout = fs
          .readFileSync(path.join(__dirname, 'testdata/audit/error.txt'))
          .toString()

        return {
          pid: 100,
          output: [null, stdout, ''],
          stdout,
          stderr: '',
          status: 1,
          signal: null,
          error: undefined
        }
      }
    )

    audit.run('low', 'true', 'false')
    expect(audit.foundVulnerability()).toBeTruthy()
  })

  test('finds vulnerabilities with json flag enabled', () => {
    vi.mocked(child_process).spawnSync.mockImplementation(
      (): child_process.SpawnSyncReturns<string> => {
        const stdout = fs
          .readFileSync(path.join(__dirname, 'testdata/audit/error.json'))
          .toString()

        return {
          pid: 100,
          output: [null, stdout, ''],
          stdout,
          stderr: '',
          status: 1,
          signal: null,
          error: undefined
        }
      }
    )

    audit.run('low', 'false', 'true')
    expect(audit.foundVulnerability()).toBeTruthy()
  })

  test('does not find vulnerabilities', () => {
    vi.mocked(child_process).spawnSync.mockImplementation(
      (): child_process.SpawnSyncReturns<string> => {
        const stdout = fs
          .readFileSync(path.join(__dirname, 'testdata/audit/success.txt'))
          .toString()

        return {
          pid: 100,
          output: [null, stdout, ''],
          stdout,
          stderr: '',
          status: 0,
          signal: null,
          error: undefined
        }
      }
    )

    audit.run('low', 'false', 'false')
    expect(audit.foundVulnerability()).toBeFalsy()
  })

  test('throws an error if error is not null', () => {
    vi.mocked(child_process).spawnSync.mockImplementation(
      (): child_process.SpawnSyncReturns<string> => {
        return {
          pid: 100,
          output: [null, '', ''],
          stdout: '',
          stderr: '',
          status: 0,
          signal: null,
          error: new Error('Something is wrong')
        }
      }
    )

    expect.assertions(1)
    const e = new Error('Something is wrong')
    expect(() => audit.run('low', 'false', 'false')).toThrowError(e)
  })

  test('throws an error if status is null', () => {
    vi.mocked(child_process).spawnSync.mockImplementation(
      (): child_process.SpawnSyncReturns<string> => {
        return {
          pid: 100,
          output: [null, '', ''],
          stdout: '',
          stderr: '',
          status: null,
          signal: 'SIGTERM',
          error: undefined
        }
      }
    )

    expect.assertions(1)
    const e = new Error('the subprocess terminated due to a signal.')
    expect(() => audit.run('low', 'false', 'false')).toThrowError(e)
  })

  test('throws an error if stderr is null', () => {
    vi.mocked(child_process).spawnSync.mockImplementation(
      (): child_process.SpawnSyncReturns<string> => {
        return {
          pid: 100,
          output: [null, '', 'Something is wrong'],
          stdout: '',
          stderr: 'Something is wrong',
          status: 1,
          signal: null,
          error: undefined
        }
      }
    )

    expect.assertions(1)
    const e = new Error('Something is wrong')
    expect(() => audit.run('low', 'false', 'false')).toThrowError(e)
  })
})
