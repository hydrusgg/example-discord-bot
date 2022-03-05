const WebSocket = require('ws')
const { EventEmitter } = require('events')

let store
const eventHandlers = new EventEmitter()

function createRTC() {
  const websocket = new WebSocket(`wss://rtc.hydrus.gg/${process.env.TOKEN}/discord`)
  websocket.on('message', (data) => {
    const { event, payload } = JSON.parse(data.toString())
    eventHandlers.emit(event, payload)
  })
  websocket.on('error', (error) => eventHandlers.emit('$error', error))
  websocket.on('close', () => eventHandlers.emit('$close'))
  websocket.on('open', () => eventHandlers.emit('$open', websocket))
}

createRTC()

eventHandlers.on('HANDSHAKE', (response) => {
  if (response.error) {
    console.error('Handshake failed: '+response.error)
    process.exit()
  } else {
    store = response
    console.log('Authorized as '+response.domain)
  }
})

eventHandlers.on('$open', socket => {
  const interval = setInterval(() => socket.ping(), 60e3)
  eventHandlers.once('$close', () => clearInterval(interval))
})

eventHandlers.on('$error', () => {
  setTimeout(createRTC, 5000)
})

eventHandlers.on('$close', () => {
  if (store !== null) {
    console.log('Disconnected from RTC, waiting 10 seconds to try again...')
    setTimeout(createRTC, 10e3)
  }
})

module.exports = eventHandlers