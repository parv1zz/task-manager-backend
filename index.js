// firebase
var admin = require("firebase-admin")
var serviceAccount = require("./service-account-file.json")

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://task-manager-tm-default-rtdb.firebaseio.com"
})

const messaging = admin.messaging()

// fs
const fs = require('fs')
// schedule
const schedule = require('node-schedule')

// notifications funcs
const sendMessage = (body) => {
  // obj
  let message = {
    token: body.token,
    notification: body.notification,
    webpush: {
      fcmOptions: {
        link: 'http://localhost:3000'
      }
    },
  }
  if(body.ids) {
    message.data = {
      taskId: String(body.ids.taskId),
      reminderId: String(body.ids.reminderId),
    }
  }

  // send
  messaging.send(message)
    .then((response) => {
      console.log('Successfully sent message:', response)

      if(body.ids) {
        account_notifications = account_notifications.filter(v => v.ids.taskId != body.ids.taskId || v.ids.reminderId != body.ids.reminderId)
        saveNotificationsToDB()
        schedules = schedules.filter(v => v.notification.ids.taskId != body.ids.taskId || v.notification.ids.reminderId != body.ids.reminderId)
      }
    })
    .catch((error) => {
      console.log('Error sending message:', error)
    })
}
const sendNotification = (body) => {
  let date = new Date(body.time)

  if(date.getTime() <= Date.now()+1000) {
    console.log('instant notification')

    sendMessage(body)
  } else {
    console.log('timed notification')

    const job = schedule.scheduleJob(date, function() {
      sendMessage(body)
    })
    if(body.ids) {
      schedules.push({
        job: job,
        notification: body
      })
    }
  }
}
const deleteNotification = (taskId, reminderId) => {
  // cancel job
  const schedule = schedules.find(v => v.notification.ids.taskId == taskId && v.notification.ids.reminderId == reminderId)
  schedule.job.cancel()
  // delete from db
  account_notifications = account_notifications.filter(v => v.ids.taskId != taskId || v.ids.reminderId != reminderId)
  saveNotificationsToDB()
  // delete from jobs
  schedules = schedules.filter(v => v.notification.ids.taskId != taskId || v.notification.ids.reminderId != reminderId)

  console.log('notification canceled')
}
const editNotification = () => {}
const replaceNotifications = () => {}

//** app starts here
//* account
const accountId = 1
let account_notifications

let schedules = []

// get from db
let all_accounts_notifications = []
const data = fs.readFileSync('./accounts_notifications.json', 'utf8', (err) => {})
// send
if(data) {
  all_accounts_notifications = JSON.parse(data)
  account_notifications = all_accounts_notifications.find(v => v.accountId = accountId).notifications

  if(account_notifications.length > 0) {
    console.log('sending from db')

    for(const notification of account_notifications) {
      sendNotification(notification)
    }
  }
}

// save to db
async function saveNotificationsToDB() {
  all_accounts_notifications.find(v => v.accountId = accountId).notifications = account_notifications
  await fs.promises.writeFile('./accounts_notifications.json', JSON.stringify(all_accounts_notifications), (err) => {})
}

// server
const express = require('express')
const app = express()
const cors = require('cors')

const port = 3001

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Hello')
})

// posts
app.post('/send-notification', (req, res) => {
  console.log('/send-notification requested...')
  
  // save notifications to db
  if(req.body.ids) {
    account_notifications.push(req.body)
    saveNotificationsToDB()
  }

  sendNotification(req.body)

  res.json({ 'status': 'Success', 'message': 'Message sent to push service' })
})

app.post('/cancel-notification', (req, res) => {
  deleteNotification(req.body.taskId, req.body.remidnerId)

  res.json({ 'status': 'Success', 'message': 'Notification deleted' })
})

// listen
app.listen(port, () => {
  ('Server is running on port ', port)
})

// // save notifications with authed account id (not with token)
// // todo 1. send notifications even after restarting server
// // todo 2. delete notifications
// todo 3. edit notifications 1) on task edit 2) on reminders edit
// todo: connect account id to notifications (after implementing id auth)
// todo: json -> db, schedule -> cron