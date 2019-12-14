import * as fs from 'fs'
import * as path from 'path'
import {mocked} from 'ts-jest/utils'
import {Audit} from '../src/audit'
import {run} from '../src/main'
import * as pr from '../src/pr'

jest.mock('../src/audit')
jest.mock('../src/pr')

describe('run', () => {
  beforeEach(() => {
    // initialize mock
    mocked(Audit).mockClear()
    mocked(pr).createComment.mockClear()

    process.env.INPUT_GITHUB_CONTEXT =
      '{ "event_name": "pull_request", "event": { "number": 100} }'
    process.env.INPUT_GITHUB_TOKEN = '***'
    process.env.GITHUB_REPOSITORY = 'alice/example'
  })

  test('does not call pr.createComment if vulnerabilities are not found', () => {
    mocked(Audit).mockImplementation((): any => {
      return {
        stdout: fs.readFileSync(
          path.join(__dirname, 'testdata/audit/success.txt')
        ),
        status: 0,
        run: (): void => {
          return
        },
        foundVulnerability: (): boolean => {
          return false
        },
        strippedStdout: (): string => {
          return path.join(__dirname, 'testdata/audit/success.txt')
        }
      }
    })

    mocked(pr).createComment.mockResolvedValue({
      config: {},
      headers: {},
      status: 201,
      statusText: 'Created',
      data: {
        value: []
      }
    })

    expect(run).not.toThrowError()
    expect(pr.createComment).not.toHaveBeenCalled()
  })

  test('calls pr.createComment if vulnerabilities are found in PR', () => {
    mocked(Audit).mockImplementation((): any => {
      return {
        stdout: fs.readFileSync(
          path.join(__dirname, 'testdata/audit/error.txt')
        ),
        status: 1,
        run: (): void => {
          return
        },
        foundVulnerability: (): boolean => {
          return true
        },
        strippedStdout: (): string => {
          return path.join(__dirname, 'testdata/audit/error.txt')
        }
      }
    })

    mocked(pr).createComment.mockResolvedValue({
      config: {},
      headers: {},
      status: 201,
      statusText: 'Created',
      data: {
        value: []
      }
    })

    expect(run).not.toThrowError()
    expect(pr.createComment).toHaveBeenCalled()
  })
})
