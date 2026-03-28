import prisma from "./Connection.db.js";

const getClient = (model) => {
  const client = prisma[model];
  if (!client) {
    throw new Error("Model Not Found");
  }
  return client;
};
export const transaction = async (actions) => {
  return await prisma.$transaction(actions);
};
export const findMany = ({ model, where = {}, include, select }) => {
  return getClient(model).findMany({
    where,
    ...(include ? { include } : {}),
    ...(select ? { select } : {}),
  });
};

export const findManyWithPaginationAndCount = async ({
  model,
  where = {},
  page = 1,
  limit = 20,
  orderBy = { createdAt: "desc" },
  select,
  include,
}) => {
  const client = getClient(model);

  const take = Math.min(Math.max(Number(limit) || 20, 1), 50);
  const p = Math.max(Number(page) || 1, 1);
  const skip = (p - 1) * take;

  const [items, totalItems] = await Promise.all([
    client.findMany({
      where,
      take,
      skip,
      orderBy,
      ...(select ? { select } : {}),
      ...(include ? { include } : {}),
    }),
    client.count({ where }),
  ]);

  const totalPages = Math.ceil(totalItems / take);
  const hasNextPage = p < totalPages;

  return {
    items,
    pagination: { page: p, limit: take, totalItems, totalPages, hasNextPage },
  };
};

export const create = ({ model, data, include, select }) => {
  return getClient(model).create({
    data,
    ...(include ? { include } : {}),
    ...(select ? { select } : {}),
  });
};

export const findOne = ({ model, where, include, select }) => {
  return getClient(model).findUnique({
    where,
    ...(include ? { include } : {}),
    ...(select ? { select } : {}),
  });
};

export const findFirst = ({ model, where, include, select }) => {
  return getClient(model).findFirst({
    where,
    ...(include ? { include } : {}),
    ...(select ? { select } : {}),
  });
};
export const updateOne = ({ model, where, data, include, select }) => {
  return getClient(model).update({
    where,
    data,
    ...(include ? { include } : {}),
    ...(select ? { select } : {}),
  });
};

export const updateMany = ({ model, where, data }) => {
  return getClient(model).updateMany({ where, data });
};

export const upsertOne = ({
  model,
  where,
  update,
  create,
  include,
  select,
}) => {
  return getClient(model).upsert({
    where,
    update,
    create,
    ...(include ? { include } : {}),
    ...(select ? { select } : {}),
  });
};

export const deleteMany = ({ model, where = {} }) => {
  return getClient(model).deleteMany({ where });
};
export const deleteOne = ({ model, where = {}, include, select }) => {
  return getClient(model).delete({
    where,
    ...(include ? { include } : {}),
    ...(select ? { select } : {}),
  });
};

export const count = ({ model, where = {} }) => {
  return getClient(model).count({ where });
};
