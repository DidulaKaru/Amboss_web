import { randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'

// Throwaway admin credentials for this run only; set before the support code imports src/config/env.ts
const adminTestPassword = randomBytes(16).toString('hex')
process.env.ADMIN_TEST_PASSWORD = adminTestPassword
process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync(adminTestPassword, 4)

export default {
  paths: ['features/**/*.feature'],
  import: ['features/support/**/*.ts', 'features/steps/**/*.ts'],
  format: ['progress-bar', 'html:reports/cucumber-report.html', 'summary'],
}
