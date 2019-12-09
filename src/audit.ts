import {spawnSync, SpawnSyncReturns} from 'child_process'

export class Audit {
  stdout: string = ''
  status: number | null = null

  public async run(): Promise<void> {
    const result: SpawnSyncReturns<string> = spawnSync('npm', ['audit'], {
      encoding: 'utf-8'
    })

    if (result.error) {
      throw result.error
    }
    if (result.status === null) {
      throw new Error('the subprocess terminated due to a signal.')
    }
    if (result.stderr && result.stderr.length > 0) {
      throw new Error(result.stderr)
    }

    this.status = result.status
    this.stdout = result.stdout
  }

  public foundVulnerability(): boolean {
    // `npm audit` return 1 when it found vulnerabilities
    return this.status === 1
  }
}
