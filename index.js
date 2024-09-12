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
const sendNotification = (body) => {
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
      }
    })
    .catch((error) => {
      console.log('Error sending message:', error)
    })
}

const deleteNotification = () => {}
const editNotification = () => {}

//* account
const accountId = 1
let account_notifications

// get from db and send
let all_accounts_notifications = []
const data = fs.readFileSync('./accounts_notifications.json', 'utf8', (err) => {})
if(data) {
  all_accounts_notifications = JSON.parse(data)
  account_notifications = all_accounts_notifications.find(v => v.accountId = accountId).notifications

  if(account_notifications.length > 0) {
    console.log('There are notifications to send')

    for(const notification of account_notifications) {
      let date = new Date(notification.time)

      if(date.getTime() <= Date.now()+1000) {
        console.log('instant notification')

        sendNotification(notification)
      } else {
        console.log('timed notification')

        const job = schedule.scheduleJob(date, function() {
          sendNotification(notification)
        })
      }
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
  
  if(req.body.ids) {
    account_notifications.push(req.body)
    saveNotificationsToDB()
  }

  let date = new Date(req.body.time)

  if(date.getTime() <= Date.now()+1000) {
    console.log('instant notification')

    sendNotification(req.body)
  } else {
    console.log('timed notification')

    const job = schedule.scheduleJob(date, function() {
      sendNotification(req.body)
    })
  }

  res.json({ 'status': 'Success', 'message': 'Message sent to push service' })
})

app.post('/cancel-notification', (req, res) => {
  // clearTimeout(notifications[token].find(v => v.taskId == req.body.taskId && v.reminderId == req.body.reminderId).timeoutId)
})

// listen
app.listen(port, () => {
  ('Server is running on port ', port)
})

// // save notifications with authed account id (not with token)
// // todo 1. send notifications even after restarting server
// todo 2. delete notifications
// todo 3. edit notifications 1) on task edit 2) on reminders edit
// todo: connect accoun id to notifications (after implementing id auth)