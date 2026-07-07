import { type SpawnSyncReturns, spawnSync } from 'node:child_process'
import { stripVTControlCharacters } from 'node:util'

const SPAWN_PROCESS_BUFFER_SIZE = 10485760 // 10MiB

// GitHub rejects issue and comment bodies longer than 65536 characters
// with "422 Validation Failed: body is too long"
const MAX_BODY_LENGTH = 65536
const TRUNCATION_NOTICE =
  '\n... (truncated)\n```\n\n**Note:** the `npm audit` output was truncated because it exceeds the maximum body length GitHub accepts.'

export class Audit {
  stdout = ''
  private status: number | null = null

  public run(
    auditLevel: string,
    productionFlag: boolean,
    jsonFlag: boolean
  ): void {
    const auditOptions: string[] = ['audit', '--audit-level', auditLevel]

    const isWindowsEnvironment: boolean = process.platform === 'win32'
    const cmd: string = isWindowsEnvironment ? 'npm.cmd' : 'npm'

    if (productionFlag) {
      auditOptions.push('--omit=dev')
    }

    if (jsonFlag) {
      auditOptions.push('--json')
    }

    // Node.js (CVE-2024-27980 fix) refuses to spawn .cmd files on Windows
    // without a shell, failing with EINVAL
    const result: SpawnSyncReturns<string> = spawnSync(cmd, auditOptions, {
      encoding: 'utf-8',
      maxBuffer: SPAWN_PROCESS_BUFFER_SIZE,
      shell: isWindowsEnvironment
    })

    if (result.error) {
      throw result.error
    }
    if (result.status === null) {
      throw new Error('the subprocess terminated due to a signal.')
    }
    if (result.stderr?.length > 0) {
      throw new Error(result.stderr)
    }

    this.status = result.status
    this.stdout = result.stdout
  }

  public foundVulnerability(): boolean {
    // `npm audit` return 1 when it found vulnerabilities
    return this.status === 1
  }

  public strippedStdout(): string {
    const stripped = stripVTControlCharacters(this.stdout)
    const body = `\`\`\`\n${stripped}\n\`\`\``
    if (body.length <= MAX_BODY_LENGTH) {
      return body
    }

    const prefix = '```\n'
    const availableLength =
      MAX_BODY_LENGTH - prefix.length - TRUNCATION_NOTICE.length
    return `${prefix}${stripped.slice(0, availableLength)}${TRUNCATION_NOTICE}`
  }
}
