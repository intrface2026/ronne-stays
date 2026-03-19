import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function main() {
  const hash = await bcrypt.hash('CHANGE_THIS_IMMEDIATELY', 12)
  await prisma.admin.upsert({
    where: { email: 'admin@ronnestays.com' },
    update: { passwordHash: hash },
    create: { email: 'admin@ronnestays.com', passwordHash: hash, name: 'Ronne Admin' }
  })
  console.log('Done. Delete this script file now.')
}
main().finally(() => prisma.$disconnect())
