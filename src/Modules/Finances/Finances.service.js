import { asyncHandler, successResponse } from "../../utils/response.js";
import * as db from "../../database/dbService.js";
export const getExpenses = asyncHandler(async (req, res, next) => {
  const { search, status } = req.query;
  let where = {};
  if (search) {
    where.title = {
      contains: search,
    };
  }
  if (status) {
    where.status = status;
  }
  if (type) {
    where.type = type;
  }
  const expense = await db.findMany({ model: "expenses", where });

  return successResponse({
    res,
    message: "Expenses",
    statusCode: 200,
    data: expense,
  });
});
