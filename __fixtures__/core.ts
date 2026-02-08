import type * as core from '@actions/core'
import { vi } from 'vitest'

export const debug = vi.fn<typeof core.debug>()
export const error = vi.fn<typeof core.error>()
export const info = vi.fn<typeof core.info>()
export const getInput = vi
  .fn<typeof core.getInput>()
  .mockImplementation((name, options) => {
    const key = `INPUT_${name.replace(/ /g, '_').toUpperCase()}`
    const value = process.env[key] || ''
    if (options?.required && value === '') {
      throw new Error(`Input required and not supplied: ${name}`)
    }
    return options?.trimWhitespace === false ? value : value.trim()
  })
export const getBooleanInput = vi
  .fn<typeof core.getBooleanInput>()
  .mockImplementation((name, options) => {
    const value = getInput(name, options)
    const normalized = value.trim().toLowerCase()

    if (normalized === 'true') {
      return true
    }
    if (normalized === 'false') {
      return false
    }

    if (options?.required && normalized === '') {
      throw new Error(`Input required and not supplied: ${name}`)
    }

    throw new Error(
      `Input does not meet YAML 1.2 "core schema" specification: ${name}`
    )
  })
export const setOutput = vi.fn<typeof core.setOutput>()
export const setFailed = vi.fn<typeof core.setFailed>()
export const warning = vi.fn<typeof core.warning>()
