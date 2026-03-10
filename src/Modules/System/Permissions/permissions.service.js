import {
  asyncHandler,
  errorResponse,
  successResponse,
} from "../../../utils/response.js";
import * as db from "../../../database/dbService.js";

export const getAllPermissions = asyncHandler(async (req, res, next) => {
  const { name, code } = req.query;
  let where = {};
  if (name) {
    where.name = name;
  }
  if (code) {
    where.code = code;
  }
  const permissions = await db.findMany({
    model: "permission",
    where,
  });
  return successResponse({
    res,
    status: 200,
    data: permissions,
  });
});

export const createPermission = asyncHandler(async (req, res, next) => {
  const { name, code } = req.body;

  const existsPermission = await db.findOne({
    model: "permission",
    where: {
      code,
    },
  });

  if (existsPermission) {
    return errorResponse({
      next,
      message: "Permission already exists",
      status: 400,
    });
  }

  const newPermission = await db.create({
    model: "permission",
    data: { name, code },
  });

  return successResponse({
    res,
    status: 201,
    data: newPermission,
  });
});

export const updatePermission = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name, code } = req.body;

  const permission = await db.findOne({
    model: "permission",
    where: { id },
  });

  if (!permission) {
    return errorResponse({
      next,
      message: "Permission not found",
      status: 404,
    });
  }

  if (name || code) {
    const existsPermission = await db.findFirst({
      model: "permission",
      where: {
        AND: [{ OR: [{ name }, { code }] }, { id: { not: id } }],
      },
    });

    if (existsPermission) {
      return errorResponse({
        next,
        message: "Permission name or code already exists",
        status: 400,
      });
    }
  }

  const updatedPermission = await db.updateOne({
    model: "permission",
    where: { id },
    data: { name, code },
  });

  return successResponse({
    res,
    status: 200,
    data: updatedPermission,
  });
});

export const deletePermission = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const permission = await db.findOne({
    model: "permission",
    where: { id },
  });

  if (!permission) {
    return errorResponse({
      next,
      message: "Permission not found",
      status: 404,
    });
  }

  await db.deleteOne({
    model: "permission",
    where: { id },
  });

  return successResponse({
    res,
    status: 200,
    message: "Permission deleted successfully",
  });
});
