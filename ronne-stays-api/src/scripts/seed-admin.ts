import { PrismaClient } from '@prisma/client'
import bcryptjs from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const args = process.argv.slice(2)
  if (args.length < 3) {
    console.error('Usage: ts-node src/scripts/seed-admin.ts <email> <name> <password>')
    process.exit(1)
  }

  const [email, name, password] = args

  try {
    const existingAdmin = await prisma.admin.findUnique({ where: { email } })
    if (existingAdmin) {
      console.error('Admin with this email already exists.')
      process.exit(1)
    }

    // High 12-round bcrypt cost parameter 
    const passwordHash = await bcryptjs.hash(password, 12)

    const newAdmin = await prisma.admin.create({
      data: {
        email,
        name,
        passwordHash,
      }
    })

    console.log(`Successfully created admin: ${newAdmin.email}`)
    console.warn('⚠️ Delete this script from the repo now ⚠️')
    process.exit(0)
  } catch (err) {
    console.error('Error seeding admin:', err)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
