import { asyncHandler, successResponse } from "../../../utils/response.js";
import * as db from "../../../database/dbService.js";
import { hash } from "../../../utils/security/index.js";

export const getAllStuff = asyncHandler(async (req, res, next) => {
  const { search } = req.query;
  let where = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
    ];
  }

  const stuff = await db.findMany({
    model: "stuff",
    where,
    include: {
      role: true,
    },
  });
  const StuffData = stuff.map((s) => {
    return {
      id: s.id,
      name: s.name,
      email: s.email,
      phone: s.phone,
      code_country: s.code_country,
      role: {
        id: s.role.id,
        name: s.role.name,
      },
    };
  });

  return successResponse({
    message: "Stuff fetched successfully",
    statusCode: 200,
    res,
    data: StuffData,
  });
});

export const getStuffById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const stuff = await db.findOne({
    model: "stuff",
    where: { id },
    include: {
      role: true,
    },
  });

  if (!stuff) {
    return next(new Error("Stuff user not found", { cause: 404 }));
  }

  const rolePermissions = await db.findOne({
    model: "role",
    where: { id: stuff.roleId },
    include: {
      rolePermissions: {
        include: {
          permission: true,
        },
      },
    },
  });

  const permissions =
    rolePermissions?.rolePermissions.map(
      (rolePermission) => rolePermission.permission,
    ) || [];

  const StuffData = {
    id: stuff.id,
    name: stuff.name,
    email: stuff.email,
    phone: stuff.phone,
    code_country: stuff.code_country,
    role: {
      id: stuff.role.id,
      name: stuff.role.name,
    },
  };

  return successResponse({
    message: "Stuff fetched successfully",
    statusCode: 200,
    res,
    data: {
      StuffData,
      permissions,
    },
  });
});

export const createStuffUser = asyncHandler(async (req, res, next) => {
  const { name, email, password, phone, codeCountry, roleId = "" } = req.body;

  const checkUser = await db.findOne({
    model: "user",
    where: { email },
  });
  if (checkUser) {
    return next(new Error("Email already exists", { cause: 400 }));
  }

  // Check if email already exists
  const existingStuff = await db.findOne({
    model: "stuff",
    where: { email },
  });

  if (existingStuff) {
    return next(new Error("Email already exists", { cause: 400 }));
  }

  const hashedPassword = hash({ password });

  const newUser = await db.create({
    model: "user",
    data: {
      email: email,
      password: hashedPassword,
      name: name,
      phone: phone,
      code_country: codeCountry,
      roleId: roleId,
    },
  });

  // Hash password

  const newStuff = await db.create({
    model: "stuff",
    data: {
      name,
      email,
      password: hashedPassword,
      phone,
      code_country: codeCountry,
      roleId,
      user_id: newUser.id,
    },
    include: {
      role: true,
    },
  });

  return successResponse({
    message: "Stuff user created successfully",
    statusCode: 201,
    res,
    data: newStuff,
  });
});

export const updateStuffUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name, phone, code_country, roleId } = req.body;

  const stuff = await db.findOne({
    model: "stuff",
    where: { id },
  });

  if (!stuff) {
    return next(new Error("Stuff user not found", { cause: 404 }));
  }

  const updatedStuff = await db.updateOne({
    model: "stuff",
    where: { id },
    data: {
      name,
      phone,
      code_country,
      roleId,
    },
    include: {
      role: true,
    },
  });
  const updatedUser = await db.updateOne({
    model: "user",
    where: { id: stuff.user_id },
    data: {
      name,
      phone,
      code_country,
      roleId,
    },
    include: {
      role: true,
    },
  });

  return successResponse({
    message: "Stuff user updated successfully",
    statusCode: 200,
    res,
    data: updatedStuff,
  });
});

export const deleteStuffUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const stuff = await db.findOne({
    model: "stuff",
    where: { id },
  });

  if (!stuff) {
    return next(new Error("Stuff user not found", { cause: 404 }));
  }

  await db.deleteOne({
    model: "stuff",
    where: { id },
  });

  return successResponse({
    message: "Stuff user deleted successfully",
    statusCode: 200,
    res,
  });
});
