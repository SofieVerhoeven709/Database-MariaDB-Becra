import 'dotenv/config'
import {defineConfig} from 'prisma/config'

export default defineConfig({
  migrations: {
    seed: 'pnpm run prisma:seed',
  },
})
