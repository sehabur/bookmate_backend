const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');

const sendMailToUser = async (mailTo, mailBody, subject) => {
  const transporter = nodemailer.createTransport(
    smtpTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    })
  );

  try {
    return await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: mailTo,
      subject,
      html: mailBody,
    });
  } catch (err) {
    return err;
  }
};

module.exports = {
  sendMailToUser,
};
