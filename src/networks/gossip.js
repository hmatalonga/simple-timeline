const path = require('path')
const crypto = require('crypto')
const EventEmitter = require('events')
const gossip = require('secure-gossip')
const network = require('@hyperswarm/network')

const Subscribed = require('../subscribed')

class GossipNetwork extends EventEmitter {
  constructor(username, topic, debug = false) {
    super();
    this.me = username
    this.subs = new Subscribed(this.me, path.join('data', `${username}.subscribed.json`))
    this.topic = crypto.createHash('sha256')
                       .update(topic)
                       .digest()

    this.gossip = gossip()
    this.swarm = network({
      ephemeral: true,
    })
    
    this.debug = debug
    this.timeline = []

    this.init()
  }

  init() {
    this.swarm.join(this.topic, {
      lookup: true, // find & connect to peers
      announce: true // optional- announce self as a connection target
    })

    this.swarm.on('connection', (socket, details) => {
      console.log(`info> found + connected to peer!`)
      console.log(details)
      socket.pipe(this.gossip.createPeerStream()).pipe(socket)
    })

    this.gossip.on('message', entry => {
      this.appendToTimeline(`${entry.username}> ${entry.message}`)
    })
  }

  subscribeUser(user) {
    this.subs.addUser(user)
    this.subs.save(path.join('data', `${this.me}.subscribed.json`))
  }

  writeMessage(data) {
    const message = data.toString().trim()
    this.gossip.publish({ username: this.me, message })
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

module.exports = GossipNetwork

