import {
  asyncHandler,
  errorResponse,
  successResponse,
} from "../../../utils/response.js";
import * as db from "../../../database/dbService.js";

export const getSubjects = asyncHandler(async (req, res, next) => {
  const { search, active } = req.query;

  let where = {};

  if (search) {
    where.OR = [
      { name_en: { contains: search } },
      { name_ar: { contains: search } },
    ];
  }

  if (active !== undefined) {
    where.active = active === "true";
  }

  const [count, activeCount] = await Promise.all([
    db.count({ model: "subjects" }),
    db.count({ model: "subjects", where: { active: true } }),
  ]);
  console.log(activeCount);

  const subjects = await db.findMany({
    model: "subjects",
    where,
  });

  return successResponse({
    res,
    message: "Subjects fetched successfully",
    status: 200,
    data: {
      count,
      activeCount,
      subjects,
    },
  });
});
export const createSubject = asyncHandler(async (req, res, next) => {
  const { name_en, name_ar, active, color } = req.body;

  const existsSubject = await db.findOne({
    model: "subjects",
    where: {
      name_en,
      name_ar,
    },
  });

  if (existsSubject) {
    return errorResponse({
      next,
      message: "Subject already exists",
      status: 400,
    });
  }

  const subject = await db.create({
    model: "subjects",
    data: {
      name_en,
      name_ar,
      active,
      color,
    },
  });
  if (!subject) {
    return errorResponse({
      next,
      message: "can't create subject",
      status: 400,
    });
  }

  return successResponse({
    res,
    message: "Subject created successfully",
    status: 201,
    data: subject,
  });
});

export const updateSubject = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name_en, name_ar, active, color } = req.body;

  const subject = await db.findOne({
    model: "subjects",
    where: { id },
  });

  if (!subject) {
    return errorResponse({
      next,
      message: "Subject not found",
      status: 404,
    });
  }

  // Prevent duplicate names
  if (name_en || name_ar) {
    const existsSubject = await db.findFirst({
      model: "subjects",
      where: {
        OR: [
          name_en ? { name_en } : undefined,
          name_ar ? { name_ar } : undefined,
        ].filter(Boolean),
        NOT: { id },
      },
    });

    if (existsSubject) {
      return errorResponse({
        next,
        message: "Subject name already exists",
        status: 400,
      });
    }
  }

  // Prepare data for update (only sent fields)
  const data = {};
  if (name_en !== undefined) data.name_en = name_en;
  if (name_ar !== undefined) data.name_ar = name_ar;
  if (active !== undefined) data.active = active;
  if (color !== undefined) data.color = color;

  const updatedSubject = await db.updateOne({
    model: "subjects",
    where: { id },
    data,
  });

  return successResponse({
    res,
    message: "Subject updated successfully",
    status: 200,
    data: updatedSubject,
  });
});

export const deleteSubject = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const subject = await db.findOne({
    model: "subjects",
    where: { id },
  });

  if (!subject) {
    return errorResponse({
      next,
      message: "Subject not found",
      status: 404,
    });
  }

  await db.deleteOne({
    model: "subjects",
    where: { id },
  });

  return successResponse({
    res,
    message: "Subject deleted successfully",
    status: 200,
  });
});
