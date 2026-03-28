import { asyncHandler, successResponse } from "../../utils/response.js";
import * as db from "../../database/dbService.js";

export const getCalendar = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query;
  const startDatee = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();

  // بداية اليوم
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  // نهاية اليوم
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const [count, planned, sessions, toDaySessions] = await Promise.all([
    db.count({
      model: "schedule",
    }),
    db.count({
      model: "schedule",
      where: {
        status: "planned",
      },
    }),
    db.findMany({
      model: "schedule",
    }),
    db.findMany({
      model: "schedule",
      where: {
        start_time: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    }),
  ]);
  return successResponse({
    res,
    data: { sessions, count, planned, toDaySessions },
    status: 200,
    message: "sessions fetched successfully",
  });
});

export const getTeachersCalendar = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const teachers = await db.findMany({
    model: "teacher",
    include: {
      schedules: {
        where: {
          start_time: {
            gte: start,
            lte: end,
          },
        },
      },
    },
  });

  return successResponse({
    res,
    data: { teachers },
    status: 200,
    message: "teachers fetched successfully",
  });
});
