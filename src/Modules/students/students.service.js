import { asyncHandler, successResponse } from "../../utils/response.js";
import * as db from "../../database/dbService.js";

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
