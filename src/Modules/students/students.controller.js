import { Router } from "express";
import { authentication } from "../../Middlewares/Authentication.js";
import * as studentService from "./students.service.js";
const router = Router();

router.get("/", authentication(), studentService.getAllStudents);

export default router;
