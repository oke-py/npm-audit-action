import * as issue from '../src/issue'

describe('getExistingIssueNumber', () => {
  const expectedTitle = 'expected title'
  const expectedIssueNumber = 12345
  const repo = 'testRepo'
  const owner = 'testOwner'

  test('gets existing open issue', async () => {
    const getIssues = vi.fn()
    getIssues.mockResolvedValue({
      data: [
        {
          title: expectedTitle,
          number: expectedIssueNumber
        }
      ]
    })
    const result = await issue.getExistingIssueNumber(
      getIssues,
      {
        repo,
        owner
      },
      expectedTitle
    )

    expect(getIssues).toHaveBeenCalledWith({
      repo,
      owner,
      state: 'open'
    })

    expect(result).toBe(expectedIssueNumber)
  })

  test('returns null when there is no open issue', async () => {
    const getIssues = vi.fn()
    getIssues.mockResolvedValue({ data: [] })

    const result = await issue.getExistingIssueNumber(
      getIssues,
      {
        repo,
        owner
      },
      expectedTitle
    )

    expect(getIssues).toHaveBeenCalledWith({
      repo,
      owner,
      state: 'open'
    })

    expect(result).toBe(null)
  })

  test('returns null when no issues match the issue title', async () => {
    const getIssues = vi.fn()
    getIssues.mockResolvedValue({
      data: [
        {
          title: 'some random other issue',
          number: 54321
        }
      ]
    })

    const result = await issue.getExistingIssueNumber(
      getIssues,
      {
        repo,
        owner
      },
      expectedTitle
    )

    expect(getIssues).toHaveBeenCalledWith({
      repo,
      owner,
      state: 'open'
    })

    expect(result).toBe(null)
  })
})
