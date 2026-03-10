import prisma from "./Connection.db.js";

const getClient = (model) => {
  const client = prisma[model];
  if (!client) {
    throw new Error("Model Not Found");
  }
  return client;
};

export const findMany = async ({ model, where = {}, include, select }) => {
  return await getClient(model).findMany({
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

export const create = async ({ model, data, include, select }) => {
  return await getClient(model).create({
    data,
    ...(include ? { include } : {}),
    ...(select ? { select } : {}),
  });
};

export const findOne = async ({ model, where, include, select }) => {
  return await getClient(model).findUnique({
    where,
    ...(include ? { include } : {}),
    ...(select ? { select } : {}),
  });
};

export const findFirst = async ({ model, where, include, select }) => {
  return await getClient(model).findFirst({
    where,
    ...(include ? { include } : {}),
    ...(select ? { select } : {}),
  });
};
export const updateOne = async ({ model, where, data, include, select }) => {
  return await getClient(model).update({
    where,
    data,
    ...(include ? { include } : {}),
    ...(select ? { select } : {}),
  });
};

export const updateMany = async ({ model, where, data }) => {
  return await getClient(model).updateMany({ where, data });
};

export const upsertOne = async ({
  model,
  where,
  update,
  create,
  include,
  select,
}) => {
  return await getClient(model).upsert({
    where,
    update,
    create,
    ...(include ? { include } : {}),
    ...(select ? { select } : {}),
  });
};

export const deleteMany = async ({ model, where = {} }) => {
  return await getClient(model).deleteMany({ where });
};
export const deleteOne = async ({ model, where = {}, include, select }) => {
  return await getClient(model).delete({
    where,
    ...(include ? { include } : {}),
    ...(select ? { select } : {}),
  });
};

export const count = async ({ model, where = {} }) => {
  return await getClient(model).count({ where });
};
