import { createServer } from 'node:http'
import { toNodeListener } from 'h3-v2'
import server from './dist/server/server.js'

console.log('Server object:', server)
console.log('Server fetch type:', typeof server?.fetch)

if (!server || typeof server.fetch !== 'function') {
  console.error('Error: server.fetch is not a function. Check dist/server/server.js exports.')
  process.exit(1)
}

const port = process.env.PORT || 8080
createServer(toNodeListener(server.fetch)).listen(port, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${port}`)
})
