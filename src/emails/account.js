const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'gpet88@gmail.com',
    subject: 'Welcome to the task manager application',
    text: 'Thanks for joining in ' + name + '. Let me know how you get along with the app.'
  })
}

const sendCancelEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'gpet88@gmail.com',
    subject: 'Thanks for using the application',
    text:'Thanks for using the app ' + name + '. Let us know why you deleted your account and what could we have done better.'
  })
}

module.exports = {
  sendWelcomeEmail,
  sendCancelEmail
}
