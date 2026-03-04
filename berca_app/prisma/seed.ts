import 'dotenv/config'
import {seedDev} from './seedDev'
import {seedProd} from './seedProd'
import {env} from 'process'
import {PrismaClient} from '@/generated/prisma/client'

const runtimeEnv = env.NODE_ENV ?? 'development'
const client = new PrismaClient()

const seedFunction = runtimeEnv === 'development' ? seedDev : seedProd

seedFunction(client)
  .then(async () => {
    await client.$disconnect()
    console.log('Successfully seeded')
  })
  .catch(async error => {
    console.error(error)
    await client.$disconnect()
    process.exit(1)
  })
