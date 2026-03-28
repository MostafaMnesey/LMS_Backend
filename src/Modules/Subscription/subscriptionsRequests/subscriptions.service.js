import {
  asyncHandler,
  errorResponse,
  successResponse,
} from "../../../utils/response.js";
import * as db from "../../../database/dbService.js";
import { redis } from "../../../utils/Radis/Connection.js";

export const getSubscriptionRequests = asyncHandler(async (req, res, next) => {
  const { search, status } = req.query;

  // بناء where clause للـ subscription_requests
  let where = {};
  if (search) {
    where = {
      OR: [
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { plan: { name_en: { contains: search, mode: "insensitive" } } },
        { plan: { name_ar: { contains: search, mode: "insensitive" } } },
      ],
    };
  }
  if (status) {
    where.status = status;
  }

  // جلب الـ subscription requests
  const subscriptionRequests = await db.findMany({
    model: "subscription_requests",
    where,
    include: {
      user: true,
      plan: true,
    },
  });

  return successResponse({
    res,
    message: "Subscription requests fetched successfully",
    status: 200,
    data: subscriptionRequests,
  });
});
export const changeStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  // جلب الـ subscription requests
  const subscriptionRequest = await db.findOne({
    model: "subscription_requests",
    where: {
      id,
    },
    include: {
      user: true,
      plan: true,
    },
  });
  if (!subscriptionRequest) {
    {
      return errorResponse({
        next,
        message: "Subscription requests not found",
        status: 404,
      });
    }
  }
  if (subscriptionRequest.status !== "pending") {
    return errorResponse({
      next,
      message: "Subscription requests already approved or rejected",
      status: 400,
    });
  }
  const studentData = await redis.get(
    `${subscriptionRequest.user.email}_Student_data`,
  );
  const parsedStudentData = JSON.parse(studentData);
  if (!parsedStudentData) {
    return errorResponse({
      next,
      message: "Student data not found",
      status: 404,
    });
  }
  const updatedSubscriptionRequest = await db.transaction([
    db.updateOne({
      model: "user",
      where: {
        id: subscriptionRequest.user.id,
      },
      data: {
        status,
      },
    }),
    db.updateOne({
      model: "subscription_requests",
      where: {
        id,
      },
      data: {
        status,
      },
    }),
  ]);
  console.log(parsedStudentData);

  if (status === "approved") {
    const student = await db.create({
      model: "student",
      data: {
        name: subscriptionRequest.user.name,
        email: subscriptionRequest.user.email,
        password: subscriptionRequest.user.password,
        phone: subscriptionRequest.user.phone,
        code_country: subscriptionRequest.user.code_country,
        birth_date: new Date(parsedStudentData.birth_date),
        gender: parsedStudentData.gender,
        country: parsedStudentData.country,
        user_id: subscriptionRequest.user.id,
        planId: subscriptionRequest.plan.id,
        status: "approved",
        active: true,
        confirm_at: new Date(),
      },
    });
    if (!student) {
      return errorResponse({
        next,
        message: "Failed to create student",
        status: 500,
      });
    }
    await redis.del(`${subscriptionRequest.user.email}_Student_data`);
  }
  return successResponse({
    res,
    message: "Subscription requests fetched successfully",
    status: 200,
  });
});
