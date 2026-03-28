import Joi from "joi";
import { generalFeilds } from "../../utils/generalFeilds/index.js";
import { notificationType } from "../../utils/enums/sessions.js";

export const createSchedule = {
  body: Joi.object()
    .keys({
      studentId: generalFeilds.id
        .messages({
          "string.empty": "studentId is required",
          "any.required": "studentId is required",
          "string.pattern.base": "studentId must be a valid ObjectId",
        })
        .required(),
      teacherId: generalFeilds.id
        .messages({
          "string.empty": "teacherId is required",
          "any.required": "teacherId is required",
          "string.pattern.base": "teacherId must be a valid ObjectId",
        })
        .required(),
      subject_id: generalFeilds.id
        .messages({
          "string.empty": "subject_id is required",
          "any.required": "subject_id is required",
          "string.pattern.base": "subject_id must be a valid ObjectId",
        })
        .required(),
      title: generalFeilds.name
        .messages({
          "string.empty": "title is required",
          "any.required": "title is required",
          "string.pattern.base": "title must be a valid string",
        })
        .required(),
      description: generalFeilds.description
        .messages({
          "string.empty": "description is required",
          "any.required": "description is required",
          "string.pattern.base": "description must be a valid string",
        })
        .required(),
      link: generalFeilds.url
        .messages({
          "string.empty": "link is required",
          "any.required": "link is required",
          "string.pattern.base": "link must be a valid url",
        })
        .required(),
      notes: generalFeilds.description.messages({
        "string.empty": "notes is required",
        "any.required": "notes is required",
        "string.pattern.base": "notes must be a valid string",
      }),

      start_time: generalFeilds.date.greater("now").messages({
        "string.empty": "start_time is required",
        "any.required": "start_time is required",
        "string.pattern.base": "start_time must be a valid dateTime",
      }),
      type: generalFeilds.type.required(),
      notification_Time: Joi.string()
        .valid(...Object.values(notificationType))
        .required()
        .messages({
          "string.empty": "notification_Time is required",
          "any.required": "notification_Time is required",
          "string.pattern.base": "notification_Time must be a valid string",
        }),
    })
    .required(),
};

export const createRecurringSchedule = {
  body: Joi.object()
    .keys({
      studentId: generalFeilds.id.required(),
      teacherId: generalFeilds.id.required(),
      subject_id: generalFeilds.id.required(),
      title: generalFeilds.name.required(),
      description: generalFeilds.description.required(),
      link: generalFeilds.url.required(),
      notes: generalFeilds.description,
      startTime: Joi.string()
        .regex(/^([01]\d|2[0-3]):?([0-5]\d)$/)
        .required()
        .messages({
          "string.pattern.base": "startTime must be in HH:mm format",
        }),
      days: Joi.array()
        .items(
          Joi.string().valid(
            "Saturday",
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
          ),
        )
        .min(1)
        .required(),
      startDate: Joi.date().iso().required(),
      endDate: Joi.date().iso().min(Joi.ref("startDate")).required(),
      notification_Time: Joi.string()
        .valid(...Object.values(notificationType))
        .required(),
      type: generalFeilds.type.required(),
    })
    .required(),
};

export const updateSchedule = {
  body: Joi.object()
    .keys({
      title: generalFeilds.name,
      description: generalFeilds.description,
      link: generalFeilds.url,
      notes: generalFeilds.description,
      status: Joi.string().valid("planned", "completed", "missed", "cancelled"),
      start_time: Joi.date().greater("now"),
      type: generalFeilds.type,
      notification_Time: Joi.string().valid(...Object.values(notificationType)),
    })
    .min(1)
    .required(),
  params: Joi.object()
    .keys({
      id: generalFeilds.id.required(),
    })
    .required(),
};

export const updateRecurringGroup = {
  body: Joi.object()
    .keys({
      title: generalFeilds.name,
      description: generalFeilds.description,
      link: generalFeilds.url,
      notes: generalFeilds.description,
      status: Joi.string().valid("planned", "completed", "missed", "cancelled"),
      startTime: Joi.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/),
      type: generalFeilds.type,
      notification_Time: Joi.string().valid(...Object.values(notificationType)),
    })
    .min(1)
    .required(),
  params: Joi.object()
    .keys({
      parent_recurring_id: generalFeilds.parent_recurring_id.required(),
    })
    .required(),
};

export const getTeacherSchedules = {
  params: Joi.object()
    .keys({
      teacherId: generalFeilds.id
        .messages({
          "string.empty": "teacherId is required",
          "any.required": "teacherId is required",
          "string.pattern.base": "teacherId must be a valid ObjectId",
        })
        .required(),
    })
    .required(),
};
export const getStudentSchedules = {
  params: Joi.object()
    .keys({
      studentId: generalFeilds.id.messages({
        "string.empty": "studentId is required",
        "any.required": "studentId is required",
        "string.pattern.base": "studentId must be a valid ObjectId",
      }),
    })
    .required(),
};

export const deleteSchedule = {
  params: Joi.object().keys({
    id: generalFeilds.id.required(),
  }),
};
export const deleteRecurringGroup = {
  params: Joi.object().keys({
    parent_recurring_id: generalFeilds.parent_recurring_id.required(),
  }),
};
