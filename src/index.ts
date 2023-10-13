import 'dotenv/config'
import http from 'http'
import { Server, Socket } from 'socket.io'
import { redisClient } from './libs/redis'
import { merge } from 'lodash'
import { sendPush } from './utils/sendPush'

async function bootstrap() {
  const connections: { [key: string]: Socket } = {}

  const server = http.createServer()
  const io = new Server(server, {
    cors: {
      origin: '*',
    },
  })

  io.on('connection', (socket) => {
    let connectionId: string | null = null

    socket.on('authenticate', (id) => {
      connections[id] = socket

      connectionId = id
    })

    socket.on('disconnect', () => {
      if (connectionId) delete connections[connectionId]
    })
  })

  server.listen(process.env.PORT ? parseInt(process.env.PORT) : 3003, () => {
    console.log(
      `Listening on *:${process.env.PORT ? parseInt(process.env.PORT) : 3003}`,
    )
  })

  await redisClient.connect()

  const subscriber = redisClient.duplicate()

  await subscriber.connect()

  await subscriber.subscribe('message', async (rawMessage) => {
    const message: {
      id: string
      senderId: string
      content: string
      createdAt: string
      viewedAt: string | null
    } = JSON.parse(rawMessage)

    const receiverSocket = connections[message.senderId]

    if (!receiverSocket) return

    receiverSocket.emit(message.id, message)
  })

  await subscriber.subscribe('chat', (rawMessage) => {
    const message: {
      message: {
        id: string
        senderId: string
        content: string
        createdAt: string
        viewedAt: string | null
      }
      receiverId: string
      chatId: string
      userName: string
      petName: string
    } = JSON.parse(rawMessage)

    const receiverSocket = connections[message.receiverId]

    if (receiverSocket) {
      receiverSocket.emit(message.chatId, message.message)
    } else {
      sendPush(message).catch(console.log)
    }
  })

  await subscriber.subscribe('new-chat', (rawMessage) => {
    const message: {
      id: string
      user1Id: string
      user2Id: string
      pet: {
        name: string
        image: {
          id: string
          path: string
        }
      }
      message: {
        id: string
        senderId: string
        content: string
        createdAt: string
        viewedAt: string | null
      }
    } = JSON.parse(rawMessage)

    const receiverSocket = connections[message.user1Id]

    if (receiverSocket) {
      receiverSocket.emit(
        'new-chat',
        merge(message, { message: { notify: true } }),
      )
    } else {
      sendPush({
        chatId: message.id,
        petName: message.pet.name,
        userName: message.user2Id,
        receiverId: message.user1Id,
      }).catch(console.log)
    }
  })
}

bootstrap()
