import { pool } from '../config/database';
import { userRepository } from '../modules/users/user.repository';
import { Role } from '../modules/users/user.types';
import { hashPassword } from '../utils/password';

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) throw new Error('Define SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD');

  if (await userRepository.findByEmail(email)) {
    console.log('El admin ya existe, nada que hacer.');
    return;
  }

  await userRepository.create({
    email,
    passwordHash: await hashPassword(password),
    firstName: 'Admin',
    lastName: 'Owner',
    role: Role.ADMIN,
  });
  console.log(`Admin creado: ${email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
