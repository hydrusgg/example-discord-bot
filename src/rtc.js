import WebSocket from 'ws'
import EventEmitter from 'events'
import api, { getPendingCommands } from './api.js'

const eventHandlers = new EventEmitter()

const headers = {
  authorization: `Bearer ${process.env.TOKEN}`,
}

async function createRTC() {
  const handshake = await api.get('@me', { validateStatus: _ => true })

  if (handshake.status !== 200) {
    console.error('Failed to handshake: HTTP %d', handshake.status)
    console.error(handshake.data)
    return
  }

  const { data: store } = handshake

  const websocket = new WebSocket('wss://ws.hydrus.gg', { headers })

  websocket.on('message', (message) => {
    if (process.env.NODE_ENV === 'local') {
      console.log(message.toString())
    }
    const { event, data } = JSON.parse(message.toString())
    eventHandlers.emit(event, data)
  })

  websocket.on('open', () => {
    websocket.send(JSON.stringify({
      event: 'SUBSCRIBE',
      data: `Stores.${store.id}.Commands.Discord`,
    }))
  })

  eventHandlers.once('Channels.Allowed', async () => {
    console.log('Connected as %s [%s]', store.domain, store.name)

    let page = 1
    const queue = []

    while (true) {
      const commands = await getPendingCommands(page)

      if (commands.length == 0) {
        break
      }

      queue.push(...commands)
      page += 1
    }

    const unique = queue.filter(({ id }, idx) => {
      const index = queue.findIndex(x => x.id == id)
      return idx == index
    })

    unique.forEach(data => {
      eventHandlers.emit('EXECUTE_COMMAND', data)
    })
  })

  websocket.on('close', () => {
    if (store != null) {
      console.log('Disconnected from RTC, waiting 10 seconds to try again...')
      setTimeout(createRTC, 10e3)
    }
  })

  websocket.on('error', () => {
    if (!store) {
      console.error('Failed to connect: %s', error.message)
      setTimeout(createRTC, 10e3)
    } else {
      console.error('Error [%s] %s', error.name, error.message)
    }
  })

  const handleDisconnect = setTimeout(() => {
    console.warn('Socket disconnected, no ping was received, no internet?')
    console.warn('Next try in 30 seconds')
    websocket.close(4000)
  }, 90_000)

  websocket.on('ping', () => handleDisconnect.refresh())
}

createRTC()

export default eventHandlers