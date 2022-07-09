import {spawnSync, SpawnSyncReturns} from 'child_process'
import stripAnsi from 'strip-ansi'

const SPAWN_PROCESS_BUFFER_SIZE = 10485760 // 10MiB

export class Audit {
  stdout = ''
  private status: number | null = null

  public run(
    auditLevel: string,
    productionFlag: string,
    jsonFlag: string
  ): void {
    try {
      const auditOptions: Array<string> = ['audit', '--audit-level', auditLevel]

      const isWindowsEnvironment: boolean = process.platform == 'win32'
      const cmd: string = isWindowsEnvironment ? 'npm.cmd' : 'npm'

      if (productionFlag === 'true') {
        auditOptions.push('--omit=dev')
      }

      if (jsonFlag === 'true') {
        auditOptions.push('--json')
      }

      const result: SpawnSyncReturns<string> = spawnSync(cmd, auditOptions, {
        encoding: 'utf-8',
        maxBuffer: SPAWN_PROCESS_BUFFER_SIZE
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
