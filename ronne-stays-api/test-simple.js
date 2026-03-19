const { PrismaClient } = require('@prisma/client')

console.log('Attempting to instantiate PrismaClient...')
const prisma = new PrismaClient()
console.log('PrismaClient instantiated successfully!')
prisma.$disconnect()
