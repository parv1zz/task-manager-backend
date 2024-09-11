// firebase
var admin = require("firebase-admin")
var serviceAccount = require("./service-account-file.json")

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://task-manager-tm-default-rtdb.firebaseio.com"
})

const messaging = admin.messaging()

// schedule and notifications
// const fs = require('fs')

// let notifications = []

// fs.readFile('./notifications.json', 'utf8', function (err, data) {
//   notifications = data ? JSON.parse(data) : []
//   console.log(notifications)
// })

// const writeToFile = async (path, data) => {
//   let filehandle = null

//   try {
//     filehandle = await fs.promises.open(path, mode = 'w')
//     // Write to file
//     await filehandle.writeFile(data)
//   } finally {
//     if (filehandle) {
//       // Close the file if it is opened.
//       await filehandle.close()
//     }
//   }
// }

const schedule = require('node-schedule')

// server
const express = require('express')
const app = express()
const cors = require('cors')

const port = 3001

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Hellooo its meeeee')
})


// send notification
app.post('/send-notification', (req, res) => {
  console.log('send-notification requested...')
  
  let date = new Date(new Date(req.body.time).getTime() + 100)

  const job = schedule.scheduleJob(date, function(){
    let message = {
      notification: {
        title: req.body.notification.title,
        body: req.body.notification.body,
      },
      token: req.body.token,
      webpush: {
        fcmOptions: {
          link: 'http://localhost:3000'
        }
      },
    }
    if(req.body.ids) {
      message.data = {
        taskId: String(req.body.ids.taskId),
        reminderId: String(req.body.ids.reminderId),
      }
    }

    messaging.send(message)
      .then((response) => {
        console.log('Successfully sent message:', response)
      })
      .catch((error) => {
        console.log('Error sending message:', error)
      })
  })

  res.json({ 'status': 'Success', 'message': 'Message sent to push service' })
})

// listen
app.listen(port, () => {
  console.log('Server is running on port ', port)
})