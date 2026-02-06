import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin1234', 12);

  const tenant = await prisma.tenant.create({
    data: {
      name: 'Demo SARL',
      ice: '001234567000089',
      rc: '123456',
      taxId: '12345678',
      address: '123 Bd Mohammed V',
      city: 'Casablanca',
      country: 'MA',
      phone: '+212 522 123456',
      email: 'contact@demo-sarl.ma',
      currency: 'MAD',
      tvaRate: 20,
    },
  });

  await prisma.user.create({
    data: {
      email: 'admin@demo.ma',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'Demo',
      role: 'ADMIN',
      tenantId: tenant.id,
    },
  });

  const client1 = await prisma.client.create({
    data: {
      tenantId: tenant.id,
      name: 'Entreprise ABC',
      contactName: 'Ahmed Benali',
      email: 'contact@abc.ma',
      phone: '+212 661 234567',
      city: 'Rabat',
      country: 'MA',
      ice: '001234567000090',
      rc: '654321',
      isVerified: true,
    },
  });

  const client2 = await prisma.client.create({
    data: {
      tenantId: tenant.id,
      name: 'Societe XYZ',
      contactName: 'Fatima Zahra',
      email: 'info@xyz.ma',
      phone: '+212 662 345678',
      city: 'Marrakech',
      country: 'MA',
      ice: '001234567000091',
      riskScore: 75,
    },
  });

  console.log('Seed completed successfully');
  console.log('Login: admin@demo.ma / admin1234');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
