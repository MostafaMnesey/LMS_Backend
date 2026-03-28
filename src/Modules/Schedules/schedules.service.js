import {
  asyncHandler,
  successResponse,
  errorResponse,
} from "../../utils/response.js";
import {
  checkExist,
  getDatesBetween,
  getEndTime,
  normalizeDate,
} from "../../utils/Helpers.js";
import { nanoid } from "nanoid";

import * as db from "../../database/dbService.js";
import { notificationType } from "../../utils/enums/sessions.js";
import {
  addNotificationJob,
  removeNotificationJob,
} from "../../utils/Workers/notifications.js";

/* ------------------------------------------------------------------ */
/*            Admin creates multiple sessions in one request            */
/* ------------------------------------------------------------------ */
export const createSchedule = asyncHandler(async (req, res, next) => {
  console.log(req.body);

  const {
    studentId,
    teacherId,
    subject_id,
    title,
    description,
    link,
    notification_Time,
    notes,
    date,
    start_time,
    type,
  } = req.body;
  const startTime = normalizeDate(start_time);
  const endTime = getEndTime(startTime, type);

  console.log("Checking overlap for:", {
    studentId,
    teacherId,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
  });

  /* check if student and teacher exist */
  const [student, teacher, subject] = await Promise.all([
    checkExist({ model: "student", where: { id: studentId }, next }),
    checkExist({ model: "teacher", where: { id: teacherId }, next }),
    checkExist({ model: "subjects", where: { id: subject_id }, next }),
  ]);

  /* check if student and teacher are available at the same time */
  const [studentSchedule, teacherSchedule] = await Promise.all([
    db.findFirst({
      model: "schedule",
      where: {
        studentId,
        start_time: { lt: endTime },
        end_time: { gt: startTime },
      },
    }),

    db.findFirst({
      model: "schedule",
      where: {
        teacherId,
        status: { not: "cancelled" },
        start_time: { lt: endTime },
        end_time: { gt: startTime },
      },
    }),
  ]);

  if (studentSchedule) {
    return errorResponse({
      next,
      status: 409,
      message: `Student has a conflict with session: "${studentSchedule.title}"`,
    });
  }

  if (teacherSchedule) {
    return errorResponse({
      next,
      status: 409,
      message: `Teacher has a conflict with session: "${teacherSchedule.title}"`,
    });
  }
  console.log(notificationType);

  // Hour check
  const requiredHours = type === "half" ? 0.5 : 1.0;
  if (student.hours_remaining < requiredHours) {
    return errorResponse({
      next,
      status: 400,
      message: `Student does not have enough hours. Remaining: ${student.hours_remaining}`,
    });
  }

  // Create the schedule and deduct hours
  const newSchedule = await db.create({
    model: "schedule",
    data: {
      studentId,
      teacherId,
      title,
      description,
      link,
      notes,
      start_time: startTime,
      end_time: endTime,
      type,
    },
  });

  await db.updateOne({
    model: "student",
    where: { id: studentId },
    data: { hours_remaining: { decrement: requiredHours } },
  });
  let reminderTime;
  let notificationJobType;
  if (notification_Time === notificationType[1]) {
    reminderTime = new Date(startTime.getTime() - 10 * 60 * 1000);
    notificationJobType = "before 10 minutes";
  } else if (notification_Time === notificationType[2]) {
    reminderTime = new Date(startTime.getTime() - 30 * 60 * 1000);
    notificationJobType = "before 30 minutes";
  } else {
    reminderTime = new Date(startTime.getTime() - 60 * 60 * 1000);
    notificationJobType = "before 60 minutes";
  }
  const now = new Date();
  if (reminderTime > now) {
    addNotificationJob({
      scheduleId: newSchedule.id,
      studentId,
      type: notificationJobType,
      sendAt: reminderTime,
    });
  } else {
    console.log("Reminder time is in the past, skipping notification job");
  }

  return successResponse({
    res,
    data: { schedule: newSchedule },
    status: 201,
    message: `Session scheduled successfully`,
  });
});

/* ------------------------------------------------------------------ */
/*            Admin creates recurring sessions in one request           */
/* ------------------------------------------------------------------ */
export const createRecurringSchedule = asyncHandler(async (req, res, next) => {
  const {
    studentId,
    teacherId,
    subject_id,
    title,
    description,
    link,
    notes,
    type,
    startTime: timeStart, // "HH:mm"
    days, // ["Saturday", ...]
    startDate, // "2026-03-26"
    endDate, // "2026-04-26"
    notification_Time,
  } = req.body;
  const skipedSchedules = [];
  const [startHour, startMin] = timeStart.split(":").map(Number);
  const perSessionHours = type === "half" ? 0.5 : 1.0;

  /* check exist student, teacher, subject */
  const [student, teacher, subject] = await Promise.all([
    checkExist({ model: "student", where: { id: studentId }, next }),
    checkExist({ model: "teacher", where: { id: teacherId }, next }),
    checkExist({ model: "subjects", where: { id: subject_id }, next }),
  ]);

  const dates = getDatesBetween(startDate, endDate, days);

  // Hour check for recurring
  const totalPotentialHours = dates.length * perSessionHours;
  if (student.hours_remaining < totalPotentialHours) {
    return errorResponse({
      next,
      status: 400,
      message: `Student does not have enough hours for ${dates.length} sessions. Required: ${totalPotentialHours}, Remaining: ${student.hours_remaining}`,
    });
  }

  const createdSchedules = [];
  const parentRecurringId = `rec_${nanoid(10)}`;

  for (const date of dates) {
    const start_time = new Date(date);
    start_time.setHours(startHour, startMin, 0, 0);

    const end_time = getEndTime(start_time, type);

    // Conflict check
    const teacher_conflict = await db.findFirst({
      model: "schedule",
      where: {
        teacherId,
        start_time: { lt: end_time },
        end_time: { gt: start_time },
      },
      include: {
        teacher: true,
      },
    });
    const student_conflict = await db.findFirst({
      model: "schedule",
      where: {
        studentId,
        start_time: { lt: end_time },
        end_time: { gt: start_time },
      },
      include: {
        student: true,
      },
    });
    console.log({
      student_conflict,
      teacher_conflict,
    });

    if (student_conflict) {
      skipedSchedules.push({
        date: date.toISOString().split("T")[0],
        title: student_conflict.title,
        conflict: `student ${student_conflict.student.name} is not available`,
      });
      continue;
    }
    if (teacher_conflict) {
      skipedSchedules.push({
        date: date.toISOString().split("T")[0],
        title: teacher_conflict.title,
        conflict: `teacher ${teacher_conflict.teacher.name} is not available`,
      });
      continue;
    }

    const schedule = await db.create({
      model: "schedule",
      data: {
        studentId,
        teacherId,
        title,
        description,
        link,
        notes,
        start_time,
        end_time,
        is_recurring: true,
        day_of_week: date.toLocaleDateString("en-US", { weekday: "long" }),
        parent_recurring_id: parentRecurringId,
      },
    });

    createdSchedules.push({
      id: schedule.id,
      date: date.toISOString().split("T")[0],
      start_time: start_time.toISOString(),
    });

    // Add notification job
    let reminderTime;
    let notificationJobType;
    if (notification_Time === notificationType[1]) {
      reminderTime = new Date(start_time.getTime() - 10 * 60 * 1000);
      notificationJobType = "before 10 minutes";
    } else if (notification_Time === notificationType[2]) {
      reminderTime = new Date(start_time.getTime() - 30 * 60 * 1000);
      notificationJobType = "before 30 minutes";
    } else {
      reminderTime = new Date(start_time.getTime() - 60 * 60 * 1000);
      notificationJobType = "before 60 minutes";
    }

    const now = new Date();
    if (reminderTime > now) {
      addNotificationJob({
        scheduleId: schedule.id,
        studentId,
        type: notificationJobType,
        sendAt: reminderTime,
      });
    }
  }

  // Deduct total hours for all created sessions
  const totalRequiredHours = createdSchedules.length * perSessionHours;

  if (createdSchedules.length > 0) {
    await db.updateOne({
      model: "student",
      where: { id: studentId },
      data: { hours_remaining: { decrement: totalRequiredHours } },
    });
  }
  return successResponse({
    res,
    status: 201,
    message: createdSchedules.length
      ? `Recurring sessions created successfully`
      : `can't create recurring sessions on ${skipedSchedules.length} days because of conflicts`,
    data: { conflicts: skipedSchedules },
  });
});

/* ------------------------------------------------------------------ */
/*             Get all schedules (teacher dashboard / admin)            */
/* ------------------------------------------------------------------ */
export const getTeacherSchedules = asyncHandler(async (req, res, next) => {
  const { teacherId } = req.params;
  const { status } = req.query;

  const where = { teacherId };
  if (status) where.status = status;

  const schedules = await db.findMany({
    model: "schedule",
    where,
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          code_country: true,
        },
      },
    },
    orderBy: { start_time: "asc" },
  });

  return successResponse({
    res,
    status: 200,
    message: "Teacher schedules fetched successfully",
    data: schedules,
  });
});

/* ------------------------------------------------------------------ */
/*              Get student schedules (student dashboard)               */
/* ------------------------------------------------------------------ */
export const getStudentSchedules = asyncHandler(async (req, res, next) => {
  const { studentId } = req.params;
  const { status } = req.query;

  const where = { studentId };
  if (status) where.status = status;

  const schedules = await db.findMany({
    model: "schedule",
    where,
    include: {
      teacher: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { start_time: "asc" },
  });

  return successResponse({
    res,
    status: 200,
    message: "Student schedules fetched successfully",
    data: schedules,
  });
});

/* ------------------------------------------------------------------ */
/*                  Delete a single session & its job                   */
/* ------------------------------------------------------------------ */
export const deleteSchedule = asyncHandler(async (req, res, next) => {
  const { schedule_id } = req.params;

  const schedule = await db.findOne({
    model: "schedule",
    where: { id: schedule_id },
  });

  if (!schedule) {
    return errorResponse({ next, status: 404, message: "Schedule not found" });
  }

  // Removal job from BullMQ
  await removeNotificationJob(schedule_id);

  // Refund hours if it wasn't already cancelled
  if (schedule.status !== "cancelled") {
    const refundHours = schedule.type === "half" ? 0.5 : 1.0;
    await db.updateOne({
      model: "student",
      where: { id: schedule.studentId },
      data: { hours_remaining: { increment: refundHours } },
    });
  }

  // Delete from DB
  await db.deleteOne({
    model: "schedule",
    where: { id: schedule_id },
  });

  return successResponse({
    res,
    status: 200,
    message: "Session deleted successfully",
  });
});

/* ------------------------------------------------------------------ */
/*              Delete a recurring group & all its jobs                 */
/* ------------------------------------------------------------------ */
export const deleteRecurringGroup = asyncHandler(async (req, res, next) => {
  const { parent_recurring_id } = req.params;

  const schedules = await db.findMany({
    model: "schedule",
    where: { parent_recurring_id },
    select: { id: true },
  });

  const sessionsCount = schedules.length;

  if (!sessionsCount) {
    return errorResponse({
      next,
      status: 404,
      message: "Recurring group not found",
    });
  }

  // Remove all jobs
  await Promise.all(schedules.map((s) => removeNotificationJob(s.id)));

  // Refund hours for sessions that weren't already cancelled
  const sessionsToRefund = await db.findMany({
    model: "schedule",
    where: { parent_recurring_id, status: { not: "cancelled" } },
    select: { type: true },
  });

  if (sessionsToRefund.length > 0) {
    const totalRefund = sessionsToRefund.reduce(
      (sum, s) => sum + (s.type === "half" ? 0.5 : 1.0),
      0,
    );
    const firstSchedule = await db.findFirst({
      model: "schedule",
      where: { parent_recurring_id },
    });

    if (firstSchedule) {
      await db.updateOne({
        model: "student",
        where: { id: firstSchedule.studentId },
        data: { hours_remaining: { increment: totalRefund } },
      });
    }
  }

  // Delete all sessions
  await db.deleteMany({
    model: "schedule",
    where: { parent_recurring_id },
  });

  return successResponse({
    res,
    status: 200,
    message: `${schedules.length} recurring sessions deleted successfully`,
  });
});

/* ------------------------------------------------------------------ */
/*                  Update a single session & its job                   */
/* ------------------------------------------------------------------ */
export const updateSchedule = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { start_time, type, notification_Time, ...otherData } = req.body;

  const schedule = await db.findOne({
    model: "schedule",
    where: { id },
    include: { student: true },
  });

  if (!schedule) {
    return errorResponse({ next, status: 404, message: "Schedule not found" });
  }

  let startTime = schedule.start_time;
  let endTime = schedule.end_time;
  let sessionType = schedule.type;
  let scheduleUpdated = false;

  const updateData = { ...otherData };

  // If time or type changes, recalculate end time and check conflicts
  if (start_time || type) {
    startTime = start_time ? normalizeDate(start_time) : startTime;
    sessionType = type || sessionType;
    endTime = getEndTime(startTime, sessionType);

    updateData.start_time = startTime;
    updateData.end_time = endTime;
    updateData.type = sessionType;
    scheduleUpdated = true;

    // Conflict check
    const teacher_conflict = await db.findFirst({
      model: "schedule",
      where: {
        teacherId: schedule.teacherId,
        id: { not: id },
        start_time: { lt: endTime },
        end_time: { gt: startTime },
      },
    });
    const student_conflict = await db.findFirst({
      model: "schedule",
      where: {
        studentId: schedule.studentId,
        id: { not: id },
        start_time: { lt: endTime },
        end_time: { gt: startTime },
      },
    });

    if (teacher_conflict || student_conflict) {
      return errorResponse({
        next,
        status: 409,
        message: "Update failed due to conflict with existing session",
      });
    }
  }

  // Handle hour adjustments for status change
  if (otherData.status && otherData.status !== schedule.status) {
    const sessionHours = (type || schedule.type) === "half" ? 0.5 : 1.0;
    if (otherData.status === "cancelled") {
      // Refund
      await db.updateOne({
        model: "student",
        where: { id: schedule.studentId },
        data: { hours_remaining: { increment: sessionHours } },
      });
    } else if (schedule.status === "cancelled") {
      // Restoring: Deduct
      if (schedule.student.hours_remaining < sessionHours) {
        return errorResponse({
          next,
          status: 400,
          message: "Student does not have enough hours to restore this session",
        });
      }
      await db.updateOne({
        model: "student",
        where: { id: schedule.studentId },
        data: { hours_remaining: { decrement: sessionHours } },
      });
    }
  }

  // Adjust hours if type changed (only if session is active)
  const finalStatus = otherData.status || schedule.status;
  if (type && type !== schedule.type && finalStatus !== "cancelled") {
    const oldHours = schedule.type === "half" ? 0.5 : 1.0;
    const newHours = type === "half" ? 0.5 : 1.0;
    const hourDiff = newHours - oldHours;

    if (hourDiff !== 0) {
      if (hourDiff > 0 && schedule.student.hours_remaining < hourDiff) {
        return errorResponse({
          next,
          status: 400,
          message: "Student does not have enough hours for this change",
        });
      }

      await db.updateOne({
        model: "student",
        where: { id: schedule.studentId },
        data: { hours_remaining: { decrement: hourDiff } },
      });
    }
  }

  const updatedSchedule = await db.updateOne({
    model: "schedule",
    where: { id },
    data: updateData,
  });

  // Handle notification job update
  if (scheduleUpdated || notification_Time || otherData.status) {
    await removeNotificationJob(id);

    // Only add a new job if the session is still "planned"
    const currentStatus = otherData.status || updatedSchedule.status;
    if (currentStatus === "planned") {
      const effectiveNotificationTime = notification_Time || "60";

      let reminderTime;
      let notificationJobType;
      if (effectiveNotificationTime === notificationType[1]) {
        reminderTime = new Date(startTime.getTime() - 10 * 60 * 1000);
        notificationJobType = "before 10 minutes";
      } else if (effectiveNotificationTime === notificationType[2]) {
        reminderTime = new Date(startTime.getTime() - 30 * 60 * 1000);
        notificationJobType = "before 30 minutes";
      } else {
        reminderTime = new Date(startTime.getTime() - 60 * 60 * 1000);
        notificationJobType = "before 60 minutes";
      }

      const now = new Date();
      if (reminderTime > now) {
        addNotificationJob({
          scheduleId: id,
          studentId: schedule.studentId,
          type: notificationJobType,
          sendAt: reminderTime,
        });
      }
    }
  }

  return successResponse({
    res,
    status: 200,
    message: "Session updated successfully",
    data: updatedSchedule,
  });
});

/* ------------------------------------------------------------------ */
/*                  Update shared fields of a group                     */
/* ------------------------------------------------------------------ */
/* export const updateRecurringGroup = asyncHandler(async (req, res, next) => {
  const { parent_recurring_id } = req.params;
  const { startTime, type, status, notification_Time, ...otherData } = req.body;

  const schedules = await db.findMany({
    model: "schedule",
    where: { parent_recurring_id },
    include: { student: true },
  });

  if (schedules.length === 0) {
    return errorResponse({
      next,
      status: 404,
      message: "Recurring group not found",
    });
  }

  const studentId = schedules[0].studentId;
  const student = schedules[0].student;

  // 1. Handle Hour Adjustments (Type or Status change)
  const firstSchedule = schedules[0];
  const oldType = firstSchedule.type;
  const oldStatus = firstSchedule.status;

  const finalType = type || oldType;
  const finalStatus = status || oldStatus;

  let totalHourDiff = 0;

  for (const s of schedules) {
    let oldHours = s.status === "cancelled" ? 0 : s.type === "half" ? 0.5 : 1.0;
    let newHours =
      finalStatus === "cancelled" ? 0 : finalType === "half" ? 0.5 : 1.0;
    totalHourDiff += newHours - oldHours;
  }

  if (totalHourDiff !== 0) {
    if (totalHourDiff > 0 && student.hours_remaining < totalHourDiff) {
      return errorResponse({
        next,
        status: 400,
        message: `Student does not have enough hours. Required: ${totalHourDiff}, Available: ${student.hours_remaining}`,
      });
    }

    await db.updateOne({
      model: "student",
      where: { id: studentId },
      data: { hours_remaining: { decrement: totalHourDiff } },
    });
  }

  // 2. Prepare Update Data & Sync Notifications
  const updatePromises = schedules.map(async (s) => {
    const dataToUpdate = { ...otherData };
    if (status) dataToUpdate.status = status;
    if (type) dataToUpdate.type = type;

    let sStartTime = s.start_time;

    if (startTime) {
      const [sh, sm] = startTime.split(":").map(Number);
      sStartTime = new Date(s.start_time);
      sStartTime.setHours(sh, sm, 0, 0);
      dataToUpdate.start_time = sStartTime;
    }

    // Always recalculate end_time if start_time OR type changed
    if (startTime || type) {
      dataToUpdate.end_time = getEndTime(sStartTime, finalType);
    }

    const updated = await db.updateOne({
      model: "schedule",
      where: { id: s.id },
      data: dataToUpdate,
    });

    // Sync Notification Job
    await removeNotificationJob(s.id);
    if ((status || s.status) === "planned") {
      const effectNotif = notification_Time || "60";
      let reminderTime;
      let jobType;

      if (effectNotif === notificationType[1]) {
        reminderTime = new Date(sStartTime.getTime() - 10 * 60 * 1000);
        jobType = "before 10 minutes";
      } else if (effectNotif === notificationType[2]) {
        reminderTime = new Date(sStartTime.getTime() - 30 * 60 * 1000);
        jobType = "before 30 minutes";
      } else {
        reminderTime = new Date(sStartTime.getTime() - 60 * 60 * 1000);
        jobType = "before 60 minutes";
      }

      if (reminderTime > new Date()) {
        addNotificationJob({
          scheduleId: s.id,
          studentId,
          type: jobType,
          sendAt: reminderTime,
        });
      }
    }
    return updated;
  });

  await Promise.all(updatePromises);

  return successResponse({
    res,
    status: 200,
    message: `${schedules.length} recurring sessions updated successfully`,
  });
}); */
