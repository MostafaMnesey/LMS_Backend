import { Router } from "express";
import * as auth from "./auth.service.js";
//import cookieParser from "cookie-parser";
import { Validation } from "../../Middlewares/Validation.js";
import {
  forgetPasswordSchema,
  googleLoginSchema,
  googleSignupSchema,
  loginSchema,
  registeritonSchema,
  resendOtpSchema,
  resetPasswordSchema,
  verifiyCodeSchema,
} from "./auth.validation.js";
const router = Router();

router.post("/sign-up", Validation(registeritonSchema), auth.register);

router.post("/sign-in", Validation(loginSchema), auth.login); //done

//router.post("/refresh", cookieParser(), auth.refresh); //done

// router.post(
//   "/google-signup",
//   Validation(googleSignupSchema),
//   auth.googleSignUp
// ); // done

// router.post("/google-login", Validation(googleLoginSchema), auth.googlelogin); //done

router.post(
  "/verify-account",
  Validation(verifiyCodeSchema),
  auth.verifyAccount,
); //done

router.post("/resend-otp", Validation(resendOtpSchema), auth.resendOtp);
router.post(
  "/forget-password",
  Validation(forgetPasswordSchema),
  auth.forgetPassword,
);

router.patch(
  "/reset-password",
  Validation(resetPasswordSchema),
  auth.resetPassword
);

export default router;
