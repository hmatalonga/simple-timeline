const path = require('path')
const level = require('level')
const toPort = require('hash-to-port')
const scuttleup = require('scuttleup')
const streamSet = require('stream-set')
const swarm = require('discovery-swarm')

const Subscribed = require('./subscribed')

// Helper method to generate a peer network friendly id
const toAddress = name => (`${name}.local:${toPort(name)}`)


class DiscoveryNetwork {
  constructor(username, topic = 'p2p', debug = false) {
    this.me = username
    this.topic = topic
    this.subs = new Subscribed(path.join('data', `${username}.subscribed.json`))
    this.connections = streamSet()

    this.logs = scuttleup(
      level(path.join('data', `${username}.db`)),
      { valueEncoding: 'json' }
    )
    this.swarm = swarm()
    
    this.debug = debug
    this.timeline = []

    this.init()
  }

  init() {
    this.swarm.listen(toPort(this.me))
    this.swarm.join(this.topic)

    this.swarm.on('connection', (socket, info) => {
      console.log(`info> found + connected to peer!`)
      socket.pipe(this.logs.createReplicationStream({ live: true })).pipe(socket)
      this.connections.add(socket)
    })
    
    this.logs
        .createReadStream({ live: true })
        .on('data', ({ entry }) => {
          if (this.me !== entry.username && !this.subs.isFollowing(entry.username)) return
          this.appendToTimeline(`${entry.username}> ${entry.message}`)
        })
  }

  addPeer(peer) {
    this.swarm.add(toAddress(peer))
  }

  subscribeUser(user) {
    this.subs.addUser(user)
    this.subs.save(path.join('data', `${this.me}.subscribed.json`))
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

module.exports = DiscoveryNetwork
