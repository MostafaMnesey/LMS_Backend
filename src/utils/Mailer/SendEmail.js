import { transporter } from "./MailerClient.js";
import { mailTemp } from "./MailTemp.js";

export const sendEmail = async ({ to, subject, text, otp }) => {
  const html = mailTemp({ otp, title: subject, text });
  try {
    const info = await transporter.sendMail({
      from: `"Neovidia LMS" <${process.env.APP_EMAIL}>`,
      replyTo: process.env.APP_EMAIL,
      to: to,
      subject: subject,
      text: `${text}\n\nYour Verification Code is: ${otp || 'N/A'}\n\nIf you did not request this, please ignore this email.`,
      html: html,
      headers: {
        'X-Entity-Ref-ID': Date.now().toString(),
      }
    });
    console.log("Message sent:", info.messageId);
  } catch (error) {
    console.log(error);
  }
};
