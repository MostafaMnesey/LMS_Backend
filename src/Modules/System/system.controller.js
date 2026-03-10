import { Router } from "express";
import { authentication } from "../../Middlewares/Authentication.js";
import { authorization } from "../../Middlewares/Authorization.js";
import { validation } from "../../Middlewares/Validation.js";
import permissionsRouter from "./Permissions/permissions.controller.js";
import * as roles from "./system.service.js";
import { endpoints } from "./system.authorization.js";
import {
  createRoleSchema,
  deleteRoleSchema,
  updateRoleSchema,
} from "./system.validation.js";

const router = Router();

router.use("/permissions", permissionsRouter);

router.get(
  "/roles",
  authentication(),
  authorization({ accessRoles: endpoints.getAllRoles }),
  roles.getAllRoles,
);

router.post(
  "/roles/create",
  authentication(),
  authorization({ accessRoles: endpoints.createRoles }),
  validation(createRoleSchema),
  roles.createRole,
);

router.patch(
  "/roles/:id",
  authentication(),
  authorization({ accessRoles: endpoints.updateRole }),
  validation(updateRoleSchema),
  roles.updateRole,
);

router.delete(
  "/roles/:id",
  authentication(),
  authorization({ accessRoles: endpoints.deleteRole }),
  validation(deleteRoleSchema),
  roles.deleteRole,
);

export default router;
