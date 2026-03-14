import {
  asyncHandler,
  errorResponse,
  successResponse,
} from "../../../utils/response.js";
import * as db from "../../../database/dbService.js";
import { hash } from "../../../utils/security/index.js";

export const getAllTeachers = asyncHandler(async (req, res, next) => {
  const { search } = req.query;
  let where = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
    ];
  }
  const [count, teachers, activeCount] = await Promise.all([
    db.count({ model: "teacher" }),
    db.findMany({
      model: "teacher",
      where,
    }),
    db.count({
      model: "teacher",
      where: { active: true },
    }),
  ]);
  if (!teachers) {
    return errorResponse({
      message: "Teachers not found",
      next,
    });
  }
  const inactiveCount = count - activeCount;

  return successResponse({
    message: "Teachers fetched successfully",
    data: {
      count,
      teachers,
      activeCount,
      inactiveCount,
    },
    res,
  });
});

export const createTeacher = asyncHandler(async (req, res, next) => {
  const {
    name,
    email,
    password,
    phone,
    code_country,
    currency_id,
    gender,
    hour_price,
    active,
    subject_ids,
  } = req.body;

  const [checkuser, checkTeacher, checkcurrency, checksubjects] =
    await Promise.all([
      db.findOne({ model: "user", where: { email } }),
      db.findOne({ model: "teacher", where: { email } }),
      db.findOne({ model: "currency", where: { id: currency_id } }),
      db.findMany({ model: "subjects", where: { id: { in: subject_ids } } }),
    ]);
  if (checkuser || checkTeacher) {
    return errorResponse({
      message: "User or teacher already exists",
      next,
    });
  }
  if (!checkcurrency) {
    return errorResponse({
      message: "Currency not found",
      next,
    });
  }
  if (checksubjects.length !== subject_ids.length) {
    return errorResponse({
      message: "Some subjects not found",
      next,
    });
  }
  const hashedPassword = await hash({ password });
  console.log({ checkuser, checkTeacher, checkcurrency, checksubjects });
  const user = await db.create({
    model: "user",
    data: {
      name,
      email,
      password: hashedPassword,
      phone,
      code_country,
    },
  });

  const teacher = await db.create({
    model: "teacher",
    data: {
      name,
      email,
      password: hashedPassword,
      user: { connect: { id: user.id } },
      phone,
      code_country,
      currency: { connect: { id: checkcurrency.id } },
      gender,
      hour_price,
      active,
      teacherSubjects: {
        create: checksubjects.map((subject) => {
          return {
            subject: {
              connect: { id: subject.id },
            },
          };
        }),
      },
    },
  });

  return successResponse({
    message: "Teacher created successfully",
    data: teacher,
    res,
  });
});
export const getTeacher = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const teacher = await db.findOne({
    model: "teacher",
    where: { id },
    include: {
      currency: true,
      teacherSubjects: {
        include: { subject: true },
      },
    },
  });

  if (!teacher) {
    return errorResponse({
      message: "Teacher not found",
      next,
    });
  }

  return successResponse({
    message: "Teacher fetched successfully",
    data: teacher,
    res,
  });
});

export const updateTeacher = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const {
    name,
    email,
    password,
    phone,
    code_country,
    currency_id,
    gender,
    hour_price,
    active,
    subject_ids,
  } = req.body;

  const teacher = await db.findOne({ model: "teacher", where: { id } });
  if (!teacher) {
    return errorResponse({
      message: "Teacher not found",
      next,
    });
  }

  let hashedPassword;
  if (password) {
    hashedPassword = await hash({ password });
  }

  if (email && email !== teacher.email) {
    const [checkuser, checkTeacher] = await Promise.all([
      db.findOne({ model: "user", where: { email } }),
      db.findOne({ model: "teacher", where: { email } }),
    ]);
    if (checkuser || checkTeacher) {
      return errorResponse({
        message: "Email already exists",
        next,
      });
    }
  }

  if (currency_id && currency_id !== teacher.currencyId) {
    const checkcurrency = await db.findOne({
      model: "currency",
      where: { id: currency_id },
    });
    if (!checkcurrency) {
      return errorResponse({
        message: "Currency not found",
        next,
      });
    }
  }

  if (subject_ids) {
    const checksubjects = await db.findMany({
      model: "subjects",
      where: { id: { in: subject_ids } },
    });
    if (checksubjects.length !== subject_ids.length) {
      return errorResponse({
        message: "Some subjects not found",
        next,
      });
    }

    await db.deleteMany({
      model: "teacher_subject",
      where: { teacherId: id },
    });
  }

  if (name || email || hashedPassword || phone || code_country) {
    if (teacher.user_id) {
      await db.updateOne({
        model: "user",
        where: { id: teacher.user_id },
        data: {
          ...(name && { name }),
          ...(email && { email }),
          ...(hashedPassword && { password: hashedPassword }),
          ...(phone && { phone }),
          ...(code_country && { code_country }),
        },
      });
    }
  }

  const updatedTeacher = await db.updateOne({
    model: "teacher",
    where: { id },
    data: {
      ...(name && { name }),
      ...(email && { email }),
      ...(hashedPassword && { password: hashedPassword }),
      ...(phone && { phone }),
      ...(code_country && { code_country }),
      ...(currency_id && { currency: { connect: { id: currency_id } } }),
      ...(gender && { gender }),
      ...(hour_price && { hour_price }),
      ...(active !== undefined && { active }),
      ...(subject_ids && {
        teacherSubjects: {
          create: subject_ids.map((subject_id) => {
            return {
              subject: {
                connect: { id: subject_id },
              },
            };
          }),
        },
      }),
    },
  });

  return successResponse({
    message: "Teacher updated successfully",
    data: updatedTeacher,
    res,
  });
});

export const deleteTeacher = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const teacher = await db.findOne({ model: "teacher", where: { id } });
  if (!teacher) {
    return errorResponse({
      message: "Teacher not found",
      next,
    });
  }

  await db.deleteMany({
    model: "teacher_subject",
    where: { teacherId: id },
  });

  await db.deleteOne({
    model: "teacher",
    where: { id },
  });

  if (teacher.user_id) {
    await db.deleteOne({
      model: "user",
      where: { id: teacher.user_id },
    });
  }

  return successResponse({
    message: "Teacher deleted successfully",
    res,
  });
});
