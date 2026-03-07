import { googleVerify } from "../../utils/GoogleClient/index.js";
import sendEmailEvent from "../../utils/Mailer/sendEmailEvent.js";
import { redis } from "../../utils/Radis/Connection.js";
import * as db from "../../database/dbService.js";

import { asyncHandler, successResponse } from "../../utils/response.js";
import {
  compare,
  decryptText,
  encryptText,
  hash,
} from "../../utils/security/index.js";
import { generateOtp } from "../../utils/security/otp.js";
import { generateToken, verifyToken } from "../../utils/Token/token.js";

/* -------------------------------------------- ------------------------------ */
/*                                SIGN IN AND SIGN UP                           */
/* -------------------------------------------------------------------------- */
export const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, phone, codeCountry } = req.body;
  const checkuser = await db.findFirst({ model: "user", where: { email } });
  if (checkuser) {
    return next(new Error("User Already Exist", { cause: 400 }));
  }
  const hashedPassword = hash({ password });
  const encryptedPhone = encryptText({ text: phone });
  const otp = generateOtp();

  const hashedOtp = hash({ password: otp });
  await redis.set(`${email}_otp_register`, hashedOtp);
  await redis.expire(`${email}_otp_register`, 60 * 10);

  const mail = sendEmailEvent.emit("sendEmail", { email, otp });
  if (!mail) {
    return next(
      new Error("Failed to send email, please try again", { cause: 500 }),
    );
  }
  const user = await db.create({
    model: "user",
    data: {
      name,
      email,
      password: hashedPassword,
      phone: encryptedPhone,
      codeCountry,
    },
  });

  return successResponse({
    res,
    status: 201,
    message: "User Created Successfully, Please Check Your Email",
  });
});

export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new Error("Missing email or password", { cause: 400 }));
  }
  const user = await db.findFirst({
    model: "user",
    where: {
      email,
    },
  });

  if (!user) {
    return next(new Error("User Not Found", { cause: 404 }));
  }
  if (!user.password) {
    return next(new Error("User Not Found", { cause: 404 }));
  }
  const matchedPassword = compare({ password, hash: user.password });
  if (!matchedPassword) {
    return next(new Error("Invalid credentials", { cause: 401 }));
  }
  if (!user.confirmAt) {
    return next(
      new Error("User Not Confirm Please Verify Your Account", { cause: 401 }),
    );
  }

  const decryptedPhone = decryptText({ text: user.phone });
  user.phone = decryptedPhone;
  const accessToken = generateToken({ user, tokenType: "access" });
  // const refreshToken = generateToken({ user, tokenType: "refresh" });

  // res.cookie("refreshToken", refreshToken, {
  //   httpOnly: true,
  //   secure: true,
  //   sameSite: "strict",
  //   maxAge: 60 * 60 * 1000,
  // });
  return successResponse({
    res,
    status: 200,
    data: { accessToken },
  });
});

/* -------------------------------------------- ------------------------------ */
/*                RESEND OTP         And VERIFY ACCOUNT                         */
/* -------------------------------------------------------------------------- */

export const resendOtp = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const otp = generateOtp();
  const hashedOtp = hash({ password: otp });
  const isHaveOtp = await redis.get(`${email}_otp_register`);
  if (isHaveOtp)
    return next(
      new Error("user have otp , please try again latter", { cause: 400 }),
    );
  await redis.set(`${email}_otp_register`, hashedOtp);
  await redis.expire(`${email}_otp_register`, 60 * 10);
  const mail = sendEmailEvent.emit("sendEmail", { email, otp });
  if (!mail) {
    return next(
      new Error("Failed to send email, please try again", { cause: 500 }),
    );
  }

  return successResponse({
    res,
    status: 200,
    message: "Otp Sent Successfully, Please Check Your Email",
  });
});
export const verifyAccount = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;
  const hasedOtp = await redis.get(`${email}_otp_register`);

  const comparedPassword = compare({ password: otp, hash: hasedOtp });
  if (!comparedPassword) {
    return next(new Error("Invalid Otp", { cause: 401 }));
  }
  const matchedUser = await db.findFirst({
    model: "user",
    where: { email },
  });
  if (!matchedUser) {
    return next(new Error("User Not Found", { cause: 404 }));
  }
  await redis.del(`${email}_otp_register`);
  const user = await db.updateOne({
    model: "user",
    where: { email },
    data: { confirmAt: new Date().toISOString() },
  });

  if (!user) {
    return next(new Error("User Not Found", { cause: 404 }));
  }
  return successResponse({
    res,
    status: 200,
    message: "User Verified Successfully",
  });
});

export const forgetPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const checkuser = await db.findFirst({
    model: "user",
    where: { email, confirmAt: { not: null } },
  });
  if (!checkuser) {
    return next(new Error("User Not Found or Account Not Confirmed", { cause: 404 }));
  }
  const otp = generateOtp();
  const hashedOtp = hash({ password: otp });
  await redis.set(`${email}_otp_forget_password`, hashedOtp);
  await redis.expire(`${email}_otp_forget_password`, 60 * 10);
  const text="Reset Your Password"
  const subject=text

  sendEmailEvent.emit("sendEmail", { email, otp,  subject ,
    text , });

  return successResponse({
    res,
    status: 201,
    message: "Otp Sent Successfully, Please Check Your Email",
  });
});
export const resetPassword = asyncHandler(async (req, res, next) => {
  const { email, otp, password } = req.body;
  const checkuser = await db.findFirst({ model: "user", where: { email } });
  if (!checkuser) {
    return next(new Error("User Not Found", { cause: 404 }));
  }
  const hashedOtp = await redis.get(`${email}_otp_forget_password`);
  console.log(hashedOtp);
  
  
  if(!hashedOtp)
  {return next(new Error("In-valid OTP ,Please Enter vaild otp",{cause:404}))}
  

  const comparedPassword = compare({ password: otp, hash: hashedOtp });
  if (!comparedPassword) {
    return next(new Error("Invalid Otp", { cause: 401 }));
  }

  const hashedPassword = hash({ password });
  const user = await db.updateOne({
    model: "user",
    where: { email },
    data: { password: hashedPassword },
  });
  await redis.del(`${email}_otp_forget`);

  return successResponse({
    res,
    status: 201,
    message: "Password Reset Successfully, Please Login",
  });
});

// export const refresh = asyncHandler(async (req, res, next) => {
//   const { refreshToken } = req.cookies;

//   if (!refreshToken) {
//     return next(new Error("No Refresh Token", { cause: 401 }));
//   }
//   const verify = verifyToken({ token: refreshToken, tokenType: "refresh" });

//   const user = await db.findFirst({
//     model: "user",
//     where: { user_id: verify.id, confirm: { not: null } },
//   });
//   if (!user) {
//     return next(new Error("Invalid Refresh Token", { cause: 401 }));
//   }
//   const accessToken = generateToken({ user, tokenType: "access" });
//   const newRefreshToken = generateToken({ user, tokenType: "refresh" });

//   const cookie = res.cookie("refreshToken", newRefreshToken, {
//     httpOnly: true,
//     secure: true,
//     sameSite: "strict",
//     maxAge: 60 * 60 * 1000,
//   });

//   return successResponse({
//     res,
//     status: 200,
//     data: { accessToken },
//   });
// });

export const googleSignUp = asyncHandler(async (req, res, next) => {
  const { idToken } = req.body;
  const verify = await googleVerify(idToken);
  if (!verify) {
    return next(new Error("Invalid Token", { cause: 401 }));
  }

  if (!verify.email_verified) {
    return next(new Error("Email Not Verified", { cause: 401 }));
  }

  const user = await db.findFirst({
    model: "user",
    where: { email: verify.email },
  });
  if (user) {
    return next(new Error("User Already Exist", { cause: 400 }));
  }
  const date = new Date();
  const confirm = date.toISOString();
  const newUser = await db.create({
    model: "user",
    data: {
      firstName: verify.given_name,
      lastName: verify.family_name,
      email: verify.email,
      provider: "google",
      googleId: verify.sub,
      confirmAt: confirm,
      profile: {
        create: {
          avatar: verify.picture,
        },
      },
    },
  });

  return successResponse({
    res,
    status: 200,
    data: { user },
  });
});
export const googlelogin = asyncHandler(async (req, res, next) => {
  const { idToken, provider } = req.body;
  if (provider !== "google") {
    return next(new Error("Invalid Provider", { cause: 401 }));
  }
  const verify = await googleVerify(idToken);
  if (!verify) {
    return next(new Error("Invalid Token", { cause: 401 }));
  }
  if (!verify.email_verified) {
    return next(new Error("Email Not Verified", { cause: 401 }));
  }

  const user = await db.findFirst({
    model: "user",
    where: { googleId: verify.sub, provider: "google", email: verify.email },
  });
  if (!user) {
    return next(new Error("User Not Found", { cause: 404 }));
  }
  if (user.password) {
    return next(new Error("invalid credentials", { cause: 401 }));
  }

  const accessToken = generateToken({ user, tokenType: "access" });
  const refreshToken = generateToken({ user, tokenType: "refresh" });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 60 * 60 * 1000,
  });

  return successResponse({
    res,
    status: 200,
    data: { accessToken },
  });
});
