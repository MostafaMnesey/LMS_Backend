import {
  asyncHandler,
  errorResponse,
  successResponse,
} from "../../../utils/response.js";
import * as db from "../../../database/dbService.js";

export const getAllPlans = asyncHandler(async (req, res, next) => {
  const allPlans = await db.findMany({
    model: "Plans",
    select: {
      id: true,
      name_en: true,
      name_ar: true,
      price: true,
      duration: true,
      sessionsCount: true,
      active: true,
      bestSeller: true,
      currency: {
        select: {
          name_en: true,
          name_ar: true,
          symbol: true,
          code: true,
        },
      },
    },
  });
  return successResponse({
    res,
    message: "success",
    status: 200,
    data: allPlans,
  });
});
export const createPlan = asyncHandler(async (req, res, next) => {
  const {
    name_en,
    name_ar,
    price,
    duration,
    sessionsCount,
    description,
    active,
    bestSeller,
    features,
    currencyId,
  } = req.body;
  const existPlan = await db.findFirst({
    model: "Plans",
    where: {
      OR: [{ name_en }, { name_ar }],
    },
  });

  if (existPlan) {
    return errorResponse({
      next,
      message: "Plan already exists",
      status: 400,
    });
  }
  const plan = await db.create({
    model: "Plans",
    data: {
      name_en,
      name_ar,
      price: String(price),
      duration,
      sessionsCount,
      description,
      active,
      bestSeller,
      features,
      currencyId,
    },
  });
  if (!plan) {
    return errorResponse({
      next,
      message: "Failed to create plan",
      status: 400,
    });
  }
  return successResponse({
    res,
    message: "success",
    status: 200,
    data: plan,
  });
});

export const updatePlan = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const {
    name_en,
    name_ar,
    price,
    duration,
    sessionsCount,
    description,
    active,
    bestSeller,
    features,
    currencyId,
  } = req.body;

  const plan = await db.findOne({
    model: "Plans",
    where: { id },
  });

  if (!plan) {
    return errorResponse({
      next,
      message: "Plan not found",
      status: 404,
    });
  }

  // منع تكرار الاسم
  if (name_en || name_ar) {
    const existPlan = await db.findFirst({
      model: "Plans",
      where: {
        OR: [
          name_en ? { name_en } : undefined,
          name_ar ? { name_ar } : undefined,
        ].filter(Boolean),
        NOT: { id },
      },
    });

    if (existPlan) {
      return errorResponse({
        next,
        message: "Plan name already exists",
        status: 400,
      });
    }
  }

  // تجهيز البيانات للتحديث (فقط الحقول المرسلة)
  const data = {};

  if (name_en !== undefined) data.name_en = name_en;
  if (name_ar !== undefined) data.name_ar = name_ar;
  if (description !== undefined) data.description = description;
  if (price !== undefined) data.price = String(price);
  if (duration !== undefined) data.duration = duration;
  if (sessionsCount !== undefined) data.sessionsCount = sessionsCount;
  if (active !== undefined) data.active = active;
  if (bestSeller !== undefined) data.bestSeller = bestSeller;
  if (features !== undefined) data.features = features;
  if (currencyId !== undefined) data.currencyId = currencyId;

  const updatedPlan = await db.updateOne({
    model: "Plans",
    where: { id },
    data,
  });

  return successResponse({
    res,
    message: "Plan updated successfully",
    status: 200,
    data: updatedPlan,
  });
});

export const deletePlan = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const plan = await db.findOne({
    model: "Plans",
    where: { id },
  });

  if (!plan) {
    return errorResponse({
      next,
      message: "Plan not found",
      status: 404,
    });
  }

  await db.deleteOne({
    model: "Plans",
    where: { id },
  });

  return successResponse({
    res,
    message: "Plan deleted successfully",
    status: 200,
  });
});
