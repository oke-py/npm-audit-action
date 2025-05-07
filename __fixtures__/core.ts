import type * as core from '@actions/core'
import { vi } from 'vitest'

export const debug = vi.fn<typeof core.debug>()
export const error = vi.fn<typeof core.error>()
export const info = vi.fn<typeof core.info>()
export const getInput = vi
  .fn<typeof core.getInput>()
  .mockImplementation((name, options) => {
    const key = `INPUT_${name.replace(/ /g, '_').toUpperCase()}`
    return process.env[key] || ''
  })
export const setOutput = vi.fn<typeof core.setOutput>()
export const setFailed = vi.fn<typeof core.setFailed>()
export const warning = vi.fn<typeof core.warning>()
