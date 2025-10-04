// prisma/seed.ts
import { PrismaClient, Role } from '@prisma/client';
import { hash } from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL ?? 'admin@yourapp.com';
  const plain = process.env.ADMIN_PASSWORD ?? 'ChangeMe123!'; // prod'da .env'den ver
  const fullName = process.env.ADMIN_NAME ?? 'Super Admin';

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, roles: true },
  });

  if (!existing) {
    await prisma.user.create({
      data: {
        email,
        fullName,
        password: await hash(plain),
        roles: { set: [Role.ADMIN] }, // başlangıçta sadece ADMIN
      },
    });
    console.log(`✔ Created admin user: ${email}`);
  } else if (!existing.roles.includes(Role.ADMIN)) {
    // kullanıcı var ama admin değilse → ADMIN rolünü ekle
    const newRoles = Array.from(new Set([...existing.roles, Role.ADMIN]));
    await prisma.user.update({
      where: { id: existing.id },
      data: { roles: { set: newRoles } },
    });
    console.log(`✔ Updated roles (added ADMIN) for: ${email}`);
  } else {
    console.log(`• Admin already present: ${email}`);
  }
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
