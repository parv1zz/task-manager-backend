let all_accounts_notifications = [
  {
    accountId: 1,
    notifications: []
  },
]

let schedules = [
  {
    job: 'job',
    notification: {},
  }
]
const schedule = require('node-schedule')
let a = []
const job = schedule.scheduleJob(new Date(Date.now() + 5000), () => {
  console.log('asdasd')
})
a.push(job)
a[0].cancel()