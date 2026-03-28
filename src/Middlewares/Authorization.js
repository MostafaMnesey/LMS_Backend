import { asyncHandler } from "../utils/response.js";
import { findFirst } from "../database/dbService.js";

export const authorization = ({ accessRoles = [] }) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user.roleId) {
      return next(new Error("Unauthorized", { cause: 401 }));
    }
    const userRole = await findFirst({
      model: "role",
      where: {
        id: req.user.roleId,
      },
    });
    console.log(accessRoles, userRole);

    if (!userRole) {
      return next(new Error("Unauthorized", { cause: 401 }));
    }
    if (!accessRoles.includes(userRole.name)) {
      return next(new Error("Unauthorized", { cause: 403 }));
    }
    next();
  });
};
