const path = require('path')
const level = require('level')
const crypto = require('crypto')
const scuttleup = require('scuttleup')
const network = require('@hyperswarm/network')

const Subscribed = require('../subscribed')

class HyperNetwork {
  constructor(username, topic, debug = false) {
    this.me = username
    this.subs = new Subscribed(this.me, path.join('data', `${username}.subscribed.json`))
    this.topic = crypto.createHash('sha256')
                       .update(topic)
                       .digest()

    this.logs = scuttleup(
      level(path.join('data', `${username}.db`)),
      { valueEncoding: 'json' }
    )
    this.swarm = network({
      ephemeral: true,
    })
    
    this.debug = debug
    this.timeline = []

    this.init()
  }

  init() {
    this.swarm.discovery.holepunchable((err, yes) => {
      if (err) console.error('info> error while testing for holepunch capability', err)
      else if (yes) console.log('info> your network is hole-punchable!')
      else console.log('info> your network is not hole-punchable. This will degrade connectivity.')

      this.swarm.on('connection', (socket, info) => {
        console.log(`info> found + connected to peer!`)
        socket.pipe(this.logs.createReplicationStream({ live: true })).pipe(socket)
      })

      this.swarm.join(this.topic, {
        lookup: true, // find & connect to peers
        announce: true // optional- announce self as a connection target
      })
    })

    this.logs
        .createReadStream({ live: true })
        .on('data', ({ entry }) => {
          // if (!this.subs.isFollowing(entry.username)) return
          this.appendToTimeline(`${entry.username}> ${entry.message}`)
        })
  }

  close() {
    this.swarm.discovery.destroy()
    this.swarm.discovery.on('close', function () {
      process.exit()
    })
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

module.exports = HyperNetwork

