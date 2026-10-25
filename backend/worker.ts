// Точка входу Cloudflare Workers: той самий Express-застосунок, що й server.js на Node.
import { httpServerHandler } from 'cloudflare:node'
import app from './app.js'

const PORT = 8787

app.listen(PORT)

export default httpServerHandler({ port: PORT })
