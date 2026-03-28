import { Router } from "express";
import { authentication } from "../../Middlewares/Authentication.js";
import { validation } from "../../Middlewares/Validation.js";
import * as scheduleService from "./schedules.service.js";
import * as schema from "./schedules.validation.js";

const router = Router();

// Admin: Create multiple sessions for a student with a teacher
router.post(
  "/create-one",
  authentication(),
  validation(schema.createSchedule),
  scheduleService.createSchedule,
);
router.post(
  "/create-recurring",
  authentication(),
  validation(schema.createRecurringSchedule),
  scheduleService.createRecurringSchedule,
);

router.get(
  "/teacher/:teacherId",

  authentication(),
  validation(schema.getTeacherSchedules),
  scheduleService.getTeacherSchedules,
);

router.get(
  "/student/:studentId",
  authentication(),
  validation(schema.getStudentSchedules),
  scheduleService.getStudentSchedules,
);

router.delete(
  "/:id",
  authentication(),
  validation(schema.deleteSchedule),
  scheduleService.deleteSchedule,
);

router.delete(
  "/group/:parent_recurring_id",
  authentication(),
  validation(schema.deleteRecurringGroup),
  scheduleService.deleteRecurringGroup,
);

router.patch(
  "/:id",
  authentication(),
  validation(schema.updateSchedule),
  scheduleService.updateSchedule,
);

/* router.patch(
  "/group/:parent_recurring_id",
  authentication(),
  validation(schema.updateRecurringGroup),
  scheduleService.updateRecurringGroup,
); */

export default router;
