const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function test() {
  try {
    const count = await prisma.property.count()
    console.log('Success! Properties count:', count)
  } catch (err) {
    console.error('Prisma connection failed:', err.message)
    if (err.message.includes('Datasource "db" is not defined')) {
      console.log('Tip: Make sure the datasource name in schema.prisma is "db"')
    }
  } finally {
    await prisma.$disconnect()
  }
}

test()
