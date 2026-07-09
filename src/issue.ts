export type GetIssuesFunc = (options: {
  owner: string
  repo: string
  state: 'open' | 'closed' | 'all' | undefined
  [key: string]: string | undefined // Allow additional properties
}) => Promise<{
  data: Array<{ title: string; number: number; body?: string | null }>
}>

export type ExistingIssue = {
  number: number
  body?: string | null
}

export async function getExistingIssue(
  getIssues: GetIssuesFunc,
  repo: {
    owner: string
    repo: string
  },
  issueTitle: string
): Promise<ExistingIssue | null> {
  const { data: issues } = await getIssues({
    ...repo,
    state: 'open'
  })

  const iss = issues.filter((i) => i.title === issueTitle).shift()

  return iss ? { number: iss.number, body: iss.body } : null
}

// Hidden marker embedded in bodies posted by this action so that the previous
// report can be identified when dedupe_comments is enabled
export const REPORT_MARKER = '<!-- npm-audit-action -->'

export function appendReportMarker(body: string): string {
  return `${body}\n\n${REPORT_MARKER}`
}

export type ListCommentsFunc = (options: {
  owner: string
  repo: string
  issue_number: number
  per_page?: number
  page?: number
}) => Promise<{ data: Array<{ body?: string | null }> }>

// GitHub may return bodies with CRLF line endings
function normalizeBody(body: string): string {
  return body.replace(/\r\n/g, '\n').trim()
}

export async function isReportUnchanged(
  listComments: ListCommentsFunc,
  repo: {
    owner: string
    repo: string
  },
  existingIssue: ExistingIssue,
  newBody: string
): Promise<boolean> {
  let lastReport =
    existingIssue.body?.includes(REPORT_MARKER) === true
      ? existingIssue.body
      : null

  const perPage = 100
  for (let page = 1; ; page++) {
    const { data: comments } = await listComments({
      ...repo,
      issue_number: existingIssue.number,
      per_page: perPage,
      page
    })
    for (const comment of comments) {
      if (comment.body?.includes(REPORT_MARKER)) {
        lastReport = comment.body
      }
    }
    if (comments.length < perPage) {
      break
    }
  }

  return (
    lastReport !== null && normalizeBody(lastReport) === normalizeBody(newBody)
  )
}
