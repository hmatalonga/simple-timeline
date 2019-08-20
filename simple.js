require('lookup-multicast-dns/global')
const toPort = require('hash-to-port')
const streamSet = require('stream-set')
const jsonStream = require('duplex-json-stream')
const register = require('register-multicast-dns')
const topology = require('fully-connected-topology')
const Clock = require('vector-clock-class')

const toAddress = name => (`${name}.local:${toPort(name)}`)

const username = process.argv[2]
const peers = process.argv.slice(3)

const id = Math.random()
const vclock = Clock(id)
const swarm = topology(toAddress(username), peers.map(toAddress))
const connections = streamSet()

let seq = 0

register(username)

swarm.on('connection', (socket, id) => {
  console.log('info> new connection from', id)

  socket = jsonStream(socket)
  socket.on('data', data => {
    // already received this one
    if (data.seq <= vclock.get(data.from)) return
    vclock.update(data.from, data.seq)
    console.log(`${data.username}> ${data.message}`)
    connections.forEach(s => s.write(data))
  })

  connections.add(socket)
})

process.stdin.on('data', function (data) {
  const message = data.toString().trim()
  const output = { from: id, seq: seq++, username, message }
  // update my own so i dont retransmit
  vclock.update(id, seq)
  connections.forEach(socket => socket.write(output))
})