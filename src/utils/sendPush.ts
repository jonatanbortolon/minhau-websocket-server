import { oneSignalClient } from '../libs/oneSignal'
import { Notification } from '@onesignal/node-onesignal'

export async function sendPush(message: {
  userName: string
  petName: string
  chatId: string
  receiverId: string
}) {
  const notificationDraft = new Notification()

  notificationDraft.app_id = process.env.ONESIGNAL_APP_ID as string
  notificationDraft.contents = {
    en: `${message.userName} enviou uma mensagem para o pet ${message.petName}!`,
  }
  notificationDraft.headings = {
    en: `Você recebeu uma mensagem!`,
  }
  notificationDraft.url = `${process.env.SITE_URL}/conversas/${message.chatId}`
  notificationDraft.include_external_user_ids = [message.receiverId]

  return await oneSignalClient.createNotification(notificationDraft)
}
