const DiscoveryNetwork = require('./src/discovery')

function showFeed() {
  const timeline = network.getTimeline()
  if (timeline.length > 0) {
    network.getTimeline().forEach(message => console.log(message))
  } else {
    console.log('No messages!')
  }
}

function subscribeUser(user) {
  network.subscribeUser(user)
  console.log(`info> subscribed to ${user}'s feed!`)
}

function postMessage(message) {
  network.writeMessage(message)
}

function following() {
  network.getSubscribedUsers()
         .forEach(sub => console.log(sub))
}

function help() {
  const choices = [
    '/feed - Show the user feed',
    '/post {message} - Post a new message',
    '/subscribe {username} - Subscribe to an user',
    '/following - Displays following users',
    '/q - Quits the application'
  ]
  console.log('The following commands are available:')
  choices.forEach(cmd => console.log(cmd))
}

function exitApp() {
  // network.close() only necessary for Connected
  console.log(`Bye!`)
  process.exit(0)
}

// ** Main loop **
const username = process.argv[2] || 'guest'
const topic = process.argv[3] || 'timeline'
// const peers = process.argv.slice(3)
const network = new DiscoveryNetwork(username, topic)

console.log(`Welcome, ${username}!`)
console.log('What would you like to do?\nType /? to show some info...')

process.stdin.on('data', function (data) {
  let input = data.toString().trim()

  if (! input.startsWith('/')) return

  input = input.split(' ')
  const choice = input[0].slice(1).toLowerCase()
  const content = input.slice(1).join(' ')
  
  if (choice === 'q') {
    exitApp()
  } else if (choice === 'feed') {
    showFeed()
  } else if (choice === 'post') {
    postMessage(content)
  } else if (choice === 'subscribe') {
    subscribeUser(content)
  } else if (choice === 'following') {
    following()
  } else if (choice === '?') {
    help()
  } else {
    console.log('Unknown command...')
  }
})

// hypercore hyperdht