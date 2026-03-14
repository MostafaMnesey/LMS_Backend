import { Router } from "express";
import { authentication } from "../../../Middlewares/Authentication.js";
import { authorization } from "../../../Middlewares/Authorization.js";
import * as teacherService from "./teacher.service.js";
import { validation } from "../../../Middlewares/Validation.js";
import {
  createTeacherSchema,
  getAllTeachersSchema,
  getTeacherSchema,
  updateTeacherSchema,
  deleteTeacherSchema,
} from "./teacher.validation.js";
import subjectsRouter from "../subjects/subjects.controller.js";
const router = Router();
router.use("/subjects", subjectsRouter);
router.get(
  "/",
  authentication(),
  /*   authorization({ accessRoles: [] }) ,*/
  validation(getAllTeachersSchema),
  teacherService.getAllTeachers,
);
router.post(
  "/create",
  authentication(),
  validation(createTeacherSchema),
  teacherService.createTeacher,
);

router.get(
  "/:id",
  authentication(),
  validation(getTeacherSchema),
  teacherService.getTeacher,
);

router.patch(
  "/update/:id",
  authentication(),
  validation(updateTeacherSchema),
  teacherService.updateTeacher,
);

router.delete(
  "/delete/:id",
  authentication(),
  validation(deleteTeacherSchema),
  teacherService.deleteTeacher,
);

export default router;
