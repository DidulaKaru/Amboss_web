// Prints the bcrypt hash of the ADMIN_PASSWORD environment variable, for use as ADMIN_PASSWORD_HASH.
// The password is read from the environment so it never appears in the process list.
import bcrypt from 'bcryptjs'

const password = process.env.ADMIN_PASSWORD
if (!password) {
  console.error('Set ADMIN_PASSWORD first')
  process.exit(1)
}
console.log(bcrypt.hashSync(password, 10))
