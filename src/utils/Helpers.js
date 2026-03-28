import * as db from "../database/dbService.js";
import { errorResponse } from "./response.js";
export const destructData = ({ body, allowed }) => {
  return Object.keys(body).reduce((acc, key) => {
    if (allowed.includes(key)) {
      acc[key] = body[key];
    }
    return acc;
  }, {});
};

export const checkExist = async ({ model, where, next }) => {
  const existing = await db.findOne({
    model,
    where,
  });

  if (!existing) {
    return errorResponse({
      next,
      status: 404,
      message: `${model} not found`,
    });
  }

  return existing;
};

export const checkConflict = async ({ model, where, next }) => {
  const existing = await db.findOne({
    model,
    where,
  });

  if (existing) {
    return errorResponse({
      next,
      status: 400,
      message: `${model} already exists`,
    });
  }

  return existing;
};

export const getEndTime = (startTime, type) => {
  const date = normalizeDate(startTime);

  if (type === "half") {
    date.setMinutes(date.getMinutes() + 30);
  } else if (type === "full") {
    date.setHours(date.getHours() + 1);
  }

  return date;
};

export const normalizeDate = (date) => {
  const d = new Date(date);
  d.setSeconds(0);
  d.setMilliseconds(0);
  return d;
};

export const getDatesBetween = (startDate, endDate, days) => {
  const dates = [];
  let curr = new Date(startDate);
  const end = new Date(endDate);

  const dayMap = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  const targetDays = days.map((d) => dayMap[d.toLowerCase()]);

  while (curr <= end) {
    if (targetDays.includes(curr.getDay())) {
      dates.push(new Date(curr));
    }
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
};
