import { Router } from "express";
import { authentication } from "../../Middlewares/Authentication.js";
import * as calendarService from "./calendar.service.js";
import { validation } from "../../Middlewares/Validation.js";
import * as schema from "./calendar.validation.js";
const router = Router();
router.get(
  "/",
  authentication(),
  validation(schema.getCalendar),
  calendarService.getCalendar,
);
router.get(
  "/teachers",
  authentication(),
  validation(schema.getTeachersCalendar),
  calendarService.getTeachersCalendar,
);

export default router;
