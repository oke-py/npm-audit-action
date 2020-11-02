import {spawnSync, SpawnSyncReturns} from 'child_process'
import stripAnsi from 'strip-ansi'

const SPAWN_PROCESS_BUFFER_SIZE = 10485760 // 10MiB

export class Audit {
  stdout = ''
  private status: number | null = null

  public run(auditLevel: string, productionFlag: string): void {
    try {
      const auditOptions: Array<string> =['audit', '--audit-level', auditLevel];
      
      if(productionFlag === 'true') {
        auditOptions.push('--production');
      }

      const result: SpawnSyncReturns<string> = spawnSync(
        'npm',
        auditOptions,
        {
          encoding: 'utf-8',
          maxBuffer: SPAWN_PROCESS_BUFFER_SIZE
        }
      )

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
    } catch (error) {
      throw error
    }
  }

  public foundVulnerability(): boolean {
    // `npm audit` return 1 when it found vulnerabilities
    return this.status === 1
  }

  public strippedStdout(): string {
    return `\`\`\`\n${stripAnsi(this.stdout)}\n\`\`\``
  }
}
