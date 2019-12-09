import {Audit} from '../src/audit'

const audit = new Audit()

describe('npm audit', () => {
  test('finds vulnerabilities', () => {
    audit.status = 1
    expect(audit.foundVulnerability()).toBeTruthy()
  })

  test('does not find vulnerabilities', () => {
    audit.status = 0
    expect(audit.foundVulnerability()).toBeFalsy()
  })
})
