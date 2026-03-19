import prisma from './src/utils/prisma'

async function run() {
  console.log('Properties count:', await prisma.property.count());
  console.log('Admins:', await prisma.admin.findMany());
}

run().catch(console.error).finally(() => prisma.$disconnect())
