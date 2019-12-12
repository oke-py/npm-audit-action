import axios from 'axios'

export async function createComment(
  owner: string,
  repo: string,
  prNumber: number,
  body: string
): Promise<void> {
  await axios.post(
    `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`,
    {
      body
    }
  )
}
