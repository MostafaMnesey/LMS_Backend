import { Router } from "express";
import { authentication } from "../../../Middlewares/Authentication.js";
import { authorization } from "../../../Middlewares/Authorization.js";
import { validation } from "../../../Middlewares/Validation.js";
import * as permissionsService from "./permissions.service.js";
import { endpoints } from "./permissions.authorization.js";
import {
  createPermissionSchema,
  deletePermissionSchema,
  updatePermissionSchema,
} from "./permissions.validation.js";

const router = Router();

router.get(
  "/",
  authentication(),
  authorization({ accessRoles: endpoints.getAllPermissions }),
  permissionsService.getAllPermissions,
);

router.post(
  "/create",
  authentication(),
  authorization({ accessRoles: endpoints.createPermission }),
  validation(createPermissionSchema),
  permissionsService.createPermission,
);

router.patch(
  "/update/:id",
  authentication(),
  authorization({ accessRoles: endpoints.updatePermission }),
  validation(updatePermissionSchema),
  permissionsService.updatePermission,
);

router.delete(
  "/:id",
  authentication(),
  authorization({ accessRoles: endpoints.deletePermission }),
  validation(deletePermissionSchema),
  permissionsService.deletePermission,
);

export default router;
