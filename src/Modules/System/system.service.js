import {
  asyncHandler,
  errorResponse,
  successResponse,
} from "../../utils/response.js";
import * as db from "../../database/dbService.js";

export const getAllRoles = asyncHandler(async (req, res, next) => {
  const { search } = req.query;
  let where = {};
  if (search) {
    where.name = {
      contains: search,
    };
  }
  const roles = await db.findMany({ model: "role", where });
  return successResponse({
    res,
    status: 200,
    message: "all roles feteched",
    data: roles,
  });
});
export const createRole = asyncHandler(async (req, res, next) => {
  const { name } = req.body;
  if (!name) {
    return errorResponse({
      next,
      message: "name is missing",
      status: 400,
    });
  }
  const existsRole = await db.findOne({
    model: "role",
    where: {
      name,
    },
  });
  if (existsRole) {
    return errorResponse({
      next,
      message: "Role is Already exists",
      status: 400,
    });
  }
  const newRole = await db.create({
    model: "role",
    data: {
      name,
    },
  });
  return successResponse({
    res,
    status: 200,
    message: "role created",
    data: newRole,
  });
});

export const updateRole = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) {
    return errorResponse({ next, message: "name is required", status: 400 });
  }

  const role = await db.findOne({
    model: "role",
    where: { id },
  });

  if (!role) {
    return errorResponse({
      next,
      message: "Role not found",
      status: 404,
    });
  }

  if (name) {
    const existsRole = await db.findOne({
      model: "role",
      where: { name },
    });

    if (existsRole && existsRole.id !== id) {
      return errorResponse({
        next,
        message: "Role name already exists",
        status: 400,
      });
    }
  }

  const updatedRole = await db.updateOne({
    model: "role",
    where: { id },
    data: { name },
  });

  return successResponse({
    res,
    status: 200,
    data: updatedRole,
  });
});

export const deleteRole = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const role = await db.findOne({
    model: "role",
    where: { id },
  });

  if (!role) {
    return errorResponse({
      next,
      message: "Role not found",
      status: 404,
    });
  }

  await db.deleteOne({
    model: "role",
    where: { id },
  });

  return successResponse({
    res,
    status: 200,
    message: "Role deleted successfully",
  });
});
