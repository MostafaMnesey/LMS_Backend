import { Router } from "express";
import * as stuffService from "./stuff.service.js";
import { authentication } from "../../../Middlewares/Authentication.js";
import { authorization } from "../../../Middlewares/Authorization.js";
import { endpoints } from "./stuff.authorization.js";

const router = Router();

router.get(
  "/",
  authentication(),
  authorization({ accessRoles: endpoints.getAllStuff }),
  stuffService.getAllStuff,
);
router.get(
  "/:id",
  authentication(),
  authorization({ accessRoles: endpoints.getStuffById }),
  stuffService.getStuffById,
);
router.post(
  "/create",
  authentication(),
  authorization({ accessRoles: endpoints.createStuffUser }),
  stuffService.createStuffUser,
);
router.patch(
  "/update/:id",
  authentication(),
  authorization({ accessRoles: endpoints.updateStuffUser }),
  stuffService.updateStuffUser,
);
router.delete(
  "/delete  /:id",
  authentication(),
  authorization({ accessRoles: endpoints.deleteStuffUser }),
  stuffService.deleteStuffUser,
);

export default router;
