require('lookup-multicast-dns/global')
const path = require('path')
const level = require('level')
const toPort = require('hash-to-port')
const scuttleup = require('scuttleup')
const streamSet = require('stream-set')
const register = require('register-multicast-dns')
const topology = require('fully-connected-topology')
json
const Subscribed = require('../subscribed')

// Helper method to generate a peer network friendly id
const toAddress = name => (`${name}.local:${toPort(name)}`)


class ConnectedNetwork {
  constructor(username, peers, debug = false) {
    this.me = username
    this.subs = new Subscribed(this.me, path.join('data', `${username}.subscribed.json`))
    this.connections = streamSet()

    this.logs = scuttleup(
      level(path.join('data', `${username}.db`)),
      { valueEncoding: 'json' }
    )
    this.swarm = topology(
      toAddress(this.me),
      peers.map(toAddress)
    )
    
    this.debug = debug
    this.timeline = []

    this.init()
  }

  init() {
    register(this.me)

    this.swarm.on('connection', (socket, id) => {
      console.log(`info> ${id} has connected!`)
      socket.pipe(this.logs.createReplicationStream({ live: true })).pipe(socket)
      this.connections.add(socket)
    })
    
    this.logs
        .createReadStream({ live: true })
        .on('data', ({ entry }) => {
          if (!this.subs.isFollowing(entry.username)) return
          this.appendToTimeline(`${entry.username}> ${entry.message}`)
        })
  }

  addPeer(peer) {
    this.swarm.add(toAddress(peer))
  }

  close() {
    this.swarm.destroy()
  }

  subscribeUser(user, discover = false) {
    this.subs.addUser(user)
    this.subs.save(path.join('data', `${this.me}.subscribed.json`))
    
    // Do you add the peer explicitly??
    if (discover) {
      this.addPeer(user)
    }
  }

  writeMessage(data) {
    const message = data.toString().trim()
    this.logs.append({ username: this.me, message })
  }

  getSubscribedUsers() {
    return this.subs.getUsers()
  }

  appendToTimeline(post) {
    this.timeline = [...this.timeline, post]
  }

  getTimeline() {
    return this.timeline
  }
}

module.exports = ConnectedNetwork
