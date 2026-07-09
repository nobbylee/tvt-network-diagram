import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import { initSchema, seedUsers } from './db.js'
import { authRoutes } from './routes/auth.js'
import { projectRoutes } from './routes/projects.js'

initSchema()
seedUsers()

const app = Fastify({ logger: true })

await app.register(cors, {
  origin: true,
})

await app.register(multipart, {
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
})

/** 健康检查（无需登录） */
app.get('/api/health', async () => {
  return {
    ok: true,
    service: 'tvt-network-arch-server',
    version: '1.0.0',
    sprint: 3,
  }
})

await app.register(authRoutes)
await app.register(projectRoutes)

const port = Number(process.env.PORT ?? 3001)
const host = process.env.HOST ?? '0.0.0.0'

try {
  await app.listen({ port, host })
  console.log(`TVT API 已启动: http://localhost:${port}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
