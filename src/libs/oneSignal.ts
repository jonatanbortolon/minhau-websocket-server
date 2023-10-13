import * as OneSignal from '@onesignal/node-onesignal'

const configuration = OneSignal.createConfiguration({
  appKey: process.env.ONESIGNAL_APP_KEY as string,
})

export const oneSignalClient = new OneSignal.DefaultApi(configuration)
