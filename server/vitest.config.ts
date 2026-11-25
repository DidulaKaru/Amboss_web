import { randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { defineConfig } from 'vitest/config'

// Throwaway admin credentials for this run only (low bcrypt cost: tests need speed, not strength)
const adminTestPassword = randomBytes(16).toString('hex')

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    env: {
      ADMIN_TEST_PASSWORD: adminTestPassword,
      ADMIN_PASSWORD_HASH: bcrypt.hashSync(adminTestPassword, 4),
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts', 'src/db/seed.ts', 'src/**/*.d.ts'],
    },
  },
})
