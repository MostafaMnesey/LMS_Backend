import { asyncHandler, successResponse } from "../../utils/response.js";
import * as db from "../../database/dbService.js";
import { hash } from "../../utils/security/index.js";

export const getAllStudents = asyncHandler(async (req, res, next) => {
  const { search, country, plans } = req.query;
  const filter = {};
  if (search) {
    filter.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
    ];
  }
  if (country) {
    filter.country = country;
  }
  if (plans) {
    filter.planId = plans;
  }
  const students = await db.findMany({
    model: "student",
    where: filter,
  });
  return successResponse({
    res,
    message: "Students fetched successfully",
    data: students,
    status: 200,
  });
});

export const createStudent = asyncHandler(async (req, res, next) => {
  const {
    name,
    email,
    password,
    phone,
    phone_code,
    country,
    planId,
    birth_date,
    gender,
    active,
  } = req.body;
  const [
    checkEmail,
    checkPlan,
    checkUser,
    checkPhoneStudent,
    checkPhoneTeacher,
    checkPhoneStuff,
  ] = await Promise.all([
    db.findFirst({
      model: "student",
      where: { email },
    }),
    db.findFirst({
      model: "Plans",
      where: { id: planId },
    }),
    db.findFirst({
      model: "user",
      where: { email },
    }),
    db.findFirst({ model: "student", where: { phone } }),
    db.findFirst({ model: "teacher", where: { phone } }),
    db.findFirst({ model: "stuff", where: { phone } }),
  ]);
  if (checkEmail) {
    return next(new Error("Email already exists", { cause: 400 }));
  }
  if (!checkPlan) {
    return next(new Error("Plan not found", { cause: 404 }));
  }
  if (checkUser) {
    return next(
      new Error("User with this email already exists", { cause: 400 }),
    );
  }
  if (checkPhoneStudent || checkPhoneTeacher || checkPhoneStuff) {
    return next(new Error("Phone number already in use", { cause: 400 }));
  }
  const hashedPassword = hash({
    password,
  });
  const plan = await db.findFirst({
    model: "Plans",
    where: { id: planId },
  });
  console.log(plan);

  const user = await db.create({
    model: "user",
    data: {
      name,
      email,
      phone,
      password: hashedPassword,
      code_country: phone_code,
      status: "active",
      confirmAt: new Date(),
    },
  });
  if (user) {
    const student = await db.create({
      model: "student",
      data: {
        user_id: user.id,
        name,
        email,
        password: hashedPassword,
        phone,
        country,
        planId,
        birth_date: new Date(birth_date),
        code_country: phone_code,
        sessions_count: plan.sessionsCount,
        confirm_at: new Date(),
        gender,
        active,
      },
    });
  } else {
    return next(new Error("Failed to create student", { cause: 500 }));
  }
  return successResponse({
    res,
    message: "Student created successfully",
    data: null,
    status: 201,
  });
});

export const getStudentById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const student = await db.findOne({
    model: "student",
    where: { id },
    include: {
      plan: true,
    },
  });

  if (!student) {
    return next(new Error("Student not found", { cause: 404 }));
  }

  return successResponse({
    res,
    message: "Student fetched successfully",
    data: student,
    status: 200,
  });
});

export const updateStudent = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name, phone, phone_code, country, planId, birth_date, gender, active } =
    req.body;

  const student = await db.findOne({ model: "student", where: { id } });
  if (!student) {
    return next(new Error("Student not found", { cause: 404 }));
  }

  // Check phone uniqueness across all models (only if phone is changing)
  if (phone && phone !== student.phone) {
    const [checkPhoneUser, checkPhoneStudent, checkPhoneTeacher, checkPhoneStuff] =
      await Promise.all([
        db.findFirst({ model: "user", where: { phone } }),
        db.findFirst({ model: "student", where: { phone, id: { not: id } } }),
        db.findFirst({ model: "teacher", where: { phone } }),
        db.findFirst({ model: "stuff", where: { phone } }),
      ]);
    if (checkPhoneUser || checkPhoneStudent || checkPhoneTeacher || checkPhoneStuff) {
      return next(new Error("Phone number already in use", { cause: 400 }));
    }
  }

  if (planId && planId !== student.planId) {
    const plan = await db.findFirst({ model: "Plans", where: { id: planId } });
    if (!plan) {
      return next(new Error("Plan not found", { cause: 404 }));
    }
  }

  // Update user record too
  if (student.user_id) {
    await db.updateOne({
      model: "user",
      where: { id: student.user_id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(phone_code && { code_country: phone_code }),
      },
    });
  }

  const updatedStudent = await db.updateOne({
    model: "student",
    where: { id },
    data: {
      ...(name && { name }),
      ...(phone && { phone }),
      ...(phone_code && { code_country: phone_code }),
      ...(country && { country }),
      ...(planId && { planId }),
      ...(birth_date && { birth_date: new Date(birth_date) }),
      ...(gender && { gender }),
      ...(active !== undefined && { active }),
    },
  });

  return successResponse({
    res,
    message: "Student updated successfully",
    data: updatedStudent,
    status: 200,
  });
});

export const deleteStudent = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const student = await db.findOne({ model: "student", where: { id } });
  if (!student) {
    return next(new Error("Student not found", { cause: 404 }));
  }

  await db.deleteOne({ model: "student", where: { id } });

  if (student.user_id) {
    await db.deleteOne({ model: "user", where: { id: student.user_id } });
  }

  return successResponse({
    res,
    message: "Student deleted successfully",
    status: 200,
  });
});
