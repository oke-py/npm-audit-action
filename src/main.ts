import * as core from '@actions/core'
import { spawnSync, SpawnSyncReturns } from 'child_process';

async function run(): Promise<void> {
  try {
    const result: SpawnSyncReturns<string> = spawnSync('npm', ['audit'], {
      encoding: 'utf-8',
    });

    if (result.stderr && result.stderr.length > 0) {
      throw new Error(result.stderr)
    }

    core.info(result.stdout)

    if (result.status === 0) {
      // vulnerabilities are not found
      return
    }

    // TODO: open an issue
    core.debug('open an issue')
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
