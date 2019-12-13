import axios, {AxiosResponse} from 'axios'

export async function createComment(
  token: string,
  owner: string,
  repo: string,
  prNumber: number,
  body: string
): Promise<AxiosResponse> {
  const instance = axios.create({
    baseURL: 'https://api.github.com',
    headers: {
      Authorization: `token ${token}`
    }
  })
  return instance.post(`/repos/${owner}/${repo}/issues/${prNumber}/comments`, {
    body
  })
}
