require('lookup-multicast-dns/global')
const toPort = require('hash-to-port')
const jsonStream = require('duplex-json-stream')
const register = require('register-multicast-dns')
const topology = require('fully-connected-topology')
const Clock = require('vector-clock-class')
const path = require('path')
const level = require('level')
const scuttleup = require('scuttleup')
const through2 = require('through2')

const toAddress = name => (`${name}.local:${toPort(name)}`)
const toUpperCase = through2((data, enc, cb) => {
  console.log(data)
  cb(null, data)
});

const username = process.argv[2]
const peers = process.argv.slice(3)

const id = Math.random()
const vclock = Clock(id)
const swarm = topology(toAddress(username), peers.map(toAddress))
const feed = scuttleup(
  level(path.join('data', `${username}.db`)),
  { valueEncoding: 'json' }
)

let seq = 0

register(username)

swarm.on('connection', (socket, id) => {
  console.log('info> new connection from', id)
  socket
  .pipe(feed.createReplicationStream({ live: true }))
  .pipe(socket)
})

feed.createReadStream({ live: true })
    .on('data', ({ entry }) => {
      console.log(entry)
      console.log(`${entry.username}> ${entry.message}`)
    })

process.stdin.on('data', function (data) {
  const message = data.toString().trim()
  const output = { id, seq: seq++, username, message }
  // update my own so i dont retransmit
  vclock.update(id, seq)
  feed.append(output)
})