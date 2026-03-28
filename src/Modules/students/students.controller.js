import { Router } from "express";
import { authentication } from "../../Middlewares/Authentication.js";
import { authorization } from "../../Middlewares/Authorization.js";
import * as studentService from "./students.service.js";
import { endpoints } from "./student.authorization.js";
import { validation } from "../../Middlewares/Validation.js";
import {
  createStudentSchema,
  updateStudentSchema,
  studentIdSchema,
} from "./students.validation.js";

const router = Router();

router.get("/", authentication(), studentService.getAllStudents);

router.post(
  "/create",
  authentication(),
  authorization({ accessRoles: endpoints.createStudent }),
  validation(createStudentSchema),
  studentService.createStudent,
);

router.get(
  "/:id",
  authentication(),
  authorization({ accessRoles: endpoints.getStudent }),
  validation(studentIdSchema),
  studentService.getStudentById,
);

router.patch(
  "/update/:id",
  authentication(),
  authorization({ accessRoles: endpoints.updateStudent }),
  validation(updateStudentSchema),
  studentService.updateStudent,
);

router.delete(
  "/:id",
  authentication(),
  authorization({ accessRoles: endpoints.deleteStudent }),
  validation(studentIdSchema),
  studentService.deleteStudent,
);

export default router;
