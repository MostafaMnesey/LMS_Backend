import {
  asyncHandler,
  errorResponse,
  successResponse,
} from "../../../utils/response.js";
import * as db from "../../../database/dbService.js";

export const getCurrencies = asyncHandler(async (req, res, next) => {
  const { search } = req.query;
 const [count, defaultCur] = await Promise.all([
  db.count({ model: "currency" }),
  db.findFirst({
    model: "currency",
    where: { default: true },
  }),
]);
  if (search) {
    const currencies = await db.findMany({
      model: "currency",
      where: {
        OR: [
          { name_en: { contains: search } },
          { name_ar: { contains: search } },
          { symbol: { contains: search } },
          { code: { contains: search } },
        ],
      },
    });
    return successResponse({
      res,
      message: "Currencies fetched successfully",
      status: 200,
      data: {
        count: count,
        default: defaultCur,
        currencies,
      },
    });
  }
  const currencies = await db.findMany({
    model: "currency",
  });
  return successResponse({
    res,
    message: "Currencies fetched successfully",
    status: 200,
    data: {
      count: count,
      default: defaultCur,
      currencies,
    },
  });
});
export const getCurrencyById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!id) {
    return errorResponse({
      next,
      message: "Currency not found",
      status: 404,
    });
  }
  const currency = await db.findOne({ model: "currency", where: { id } });
  console.log(currency);

  if (!currency) {
    return errorResponse({
      next,
      message: "Currency not found",
      status: 404,
    });
  }
  return successResponse({
    res,
    message: "Currencies fetched successfully",
    status: 200,
    data: currency,
  });
});
export const addCurrency = asyncHandler(async (req, res, next) => {
  const {
    name_en,
    name_ar,
    symbol,
    code,
    exchangeRate,
    default: isDefault,
  } = req.body;
  console.log({
    name_en,
    name_ar,
    symbol,
    code,
    exchangeRate,
    default: isDefault,
  });

  const codeExists = await db.findFirst({
    model: "currency",
    where: {
      code: code,
    },
  });
  if (codeExists) {
    return errorResponse({
      next,
      message: "Currency code already exists",
      status: 400,
    });
  }
  const currency = await db.create({
    model: "currency",
    data: {
      name_en,
      name_ar,
      symbol,
      code,
      exchangeRate,
      default: isDefault,
    },
  });

  return successResponse({
    res,
    message: "Currency added successfully",
    status: 200,
    data: currency,
  });
});

export const updateCurrency = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const {
    name_en,
    name_ar,
    symbol,
    code,
    exchangeRate,
    default: isDefault,
  } = req.body;

  const currencyExists = await db.findFirst({
    model: "currency",
    where: { id },
  });

  if (!currencyExists) {
    return errorResponse({
      next,
      message: "Currency not found",
      status: 404,
    });
  }

  if (code) {
    const codeExists = await db.findFirst({
      model: "currency",
      where: {
        code: code,
        NOT: { id },
      },
    });
    if (codeExists) {
      return errorResponse({
        next,
        message: "Currency code already exists",
        status: 400,
      });
    }
  }

  const updatedCurrency = await db.updateOne({
    model: "currency",
    where: { id },
    data: {
      name_en,
      name_ar,
      symbol,
      code,
      exchangeRate,
      default: isDefault,
    },
  });

  return successResponse({
    res,
    message: "Currency updated successfully",
    status: 200,
    data: updatedCurrency,
  });
});
export const deleteCurrency = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const existsCurrency = await db.findFirst({
    model: "currency",
    where: { id },
  });
  if (!existsCurrency) {
    return errorResponse({
      next,
      message: "Currency not found ",
      status: 404,
    });
  }
  const deleted = await db.deleteOne({ model: "currency", where: { id } });
  if (!deleted) {
    return errorResponse({
      next,
      message: "Can not delete this currency now , please try again  ",
      status: 400,
    });
  }
  return successResponse({
    res,
    message: "Currency Deleted successfully",
    status: 200,
    data: deleted,
  });
});
