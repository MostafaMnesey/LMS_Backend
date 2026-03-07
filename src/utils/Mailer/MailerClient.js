import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // لازم true للبورت 465
  auth: {
    user: process.env.APP_EMAIL,
    pass: process.env.APP_PASSWORD,
  },
  // timeout كبير لتجنب disconnect
  connectionTimeout: 10000,
}); 


