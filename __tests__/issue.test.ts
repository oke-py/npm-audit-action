import * as issue from '../src/issue'

describe('getExistingIssue', () => {
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
          number: expectedIssueNumber,
          body: 'issue body'
        }
      ]
    })
    const result = await issue.getExistingIssue(
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

    expect(result).toEqual({ number: expectedIssueNumber, body: 'issue body' })
  })

  test('returns null when there is no open issue', async () => {
    const getIssues = vi.fn()
    getIssues.mockResolvedValue({ data: [] })

    const result = await issue.getExistingIssue(
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

    const result = await issue.getExistingIssue(
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

describe('appendReportMarker', () => {
  test('appends the hidden marker to the body', () => {
    expect(issue.appendReportMarker('report')).toBe(
      `report\n\n${issue.REPORT_MARKER}`
    )
  })
})

describe('isReportUnchanged', () => {
  const repo = { owner: 'testOwner', repo: 'testRepo' }
  const newBody = issue.appendReportMarker('report')

  test('returns true when the last marked comment has the same body', async () => {
    const listComments = vi.fn()
    listComments.mockResolvedValue({
      data: [{ body: 'a human comment' }, { body: newBody }]
    })

    const result = await issue.isReportUnchanged(
      listComments,
      repo,
      { number: 1, body: 'issue body without marker' },
      newBody
    )

    expect(listComments).toHaveBeenCalledWith({
      ...repo,
      issue_number: 1,
      per_page: 100,
      page: 1
    })
    expect(result).toBe(true)
  })

  test('returns false when the last marked comment has a different body', async () => {
    const listComments = vi.fn()
    listComments.mockResolvedValue({
      data: [{ body: issue.appendReportMarker('old report') }]
    })

    const result = await issue.isReportUnchanged(
      listComments,
      repo,
      { number: 1, body: null },
      newBody
    )

    expect(result).toBe(false)
  })

  test('returns false when no marked comment exists', async () => {
    const listComments = vi.fn()
    listComments.mockResolvedValue({
      data: [{ body: 'a human comment' }, { body: 'report' }]
    })

    const result = await issue.isReportUnchanged(
      listComments,
      repo,
      { number: 1, body: null },
      newBody
    )

    expect(result).toBe(false)
  })

  test('compares against the issue body when it has the marker and there are no comments', async () => {
    const listComments = vi.fn()
    listComments.mockResolvedValue({ data: [] })

    const result = await issue.isReportUnchanged(
      listComments,
      repo,
      { number: 1, body: newBody },
      newBody
    )

    expect(result).toBe(true)
  })

  test('prefers the last marked comment over the issue body', async () => {
    const listComments = vi.fn()
    listComments.mockResolvedValue({
      data: [{ body: issue.appendReportMarker('old report') }]
    })

    const result = await issue.isReportUnchanged(
      listComments,
      repo,
      { number: 1, body: newBody },
      newBody
    )

    expect(result).toBe(false)
  })

  test('ignores CRLF and trailing whitespace differences', async () => {
    const listComments = vi.fn()
    listComments.mockResolvedValue({
      data: [{ body: `${newBody.replace(/\n/g, '\r\n')}\r\n` }]
    })

    const result = await issue.isReportUnchanged(
      listComments,
      repo,
      { number: 1, body: null },
      newBody
    )

    expect(result).toBe(true)
  })

  test('paginates through comments', async () => {
    const listComments = vi.fn()
    const fullPage = Array.from({ length: 100 }, () => ({
      body: 'a human comment'
    }))
    listComments
      .mockResolvedValueOnce({ data: fullPage })
      .mockResolvedValueOnce({ data: [{ body: newBody }] })

    const result = await issue.isReportUnchanged(
      listComments,
      repo,
      { number: 1, body: null },
      newBody
    )

    expect(listComments).toHaveBeenCalledTimes(2)
    expect(listComments).toHaveBeenLastCalledWith({
      ...repo,
      issue_number: 1,
      per_page: 100,
      page: 2
    })
    expect(result).toBe(true)
  })
})
