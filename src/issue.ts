export type GetIssuesFunc = (options: {
  owner: string
  repo: string
  state: 'open' | 'closed' | 'all' | undefined
  [key: string]: string | undefined // Allow additional properties
}) => Promise<{ data: Array<{ title: string; number: number }> }>

export async function getExistingIssueNumber(
  getIssues: GetIssuesFunc,
  repo: {
    owner: string
    repo: string
  },
  issueTitle: string
): Promise<number | null> {
  const { data: issues } = await getIssues({
    ...repo,
    state: 'open'
  })

  const iss = issues.filter((i) => i.title === issueTitle).shift()

  return iss?.number ?? null
}
