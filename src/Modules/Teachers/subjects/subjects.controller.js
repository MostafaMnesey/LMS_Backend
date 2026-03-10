import { Router } from "express";
import { authentication } from "../../../Middlewares/Authentication.js";
import { validation } from "../../../Middlewares/Validation.js";
import * as subjectsService from "./subjects.service.js";
import {
  createSubjectSchema,
  updateSubjectSchema,
  deleteSubjectSchema,
} from "./subjects.validation.js";

const router = Router();

router.get("/", authentication(), subjectsService.getSubjects);
router.post(
  "/create",
  authentication(),
  validation(createSubjectSchema),
  subjectsService.createSubject,
);

router.patch(
  "/update/:id",
  authentication(),
  validation(updateSubjectSchema),
  subjectsService.updateSubject,
);

router.delete(
  "/delete/:id",
  authentication(),
  validation(deleteSubjectSchema),
  subjectsService.deleteSubject,
);

export default router;
