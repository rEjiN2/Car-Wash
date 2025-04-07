const logger = require("../config/logger");
const { makeObjectId } = require("../functions/global.functions");

const Create = async (Model, data) => {
  try {
    const doc = await Model.create(data);
    return doc;
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

const Find = async (
  Model,
  filter = {},
  projection = {},
  sort = {},
  limit = 0,
  skip = 0
) => {
  try {
    const query = Model.find(filter, projection);

    if (sort) {
      query.sort(sort);
    }

    if (limit > 0) {
      query.limit(limit);
    }

    if (skip > 0) {
      query.skip(skip);
    }

    const results = await query.exec();
    return results;
  } catch (error) {
    logger.error(error);
  }
};

const FindOne = async (Model, filter, projection = {}, sort = {}) => {
  try {
    return await Model.findOne(filter, projection).sort(sort);
  } catch (error) {
    logger.error(error);
  }
};

const FindOneWithKey = async (Model, filter, key, sort = {}) => {
  try {
    const projection = { [key]: 1 };
    const doc = await Model.findOne(filter, projection).sort(sort);

    if (!doc) throw new Error("doc not found!");

    if (key in doc) return doc[key];
  } catch (error) {
    logger.error(error);
  }
};

const FindById = async (Model, objectId, projection = {}) => {
  try {
    const id = makeObjectId(objectId);

    return await Model.findById(id, projection);
  } catch (error) {
    logger.error(error);
  }
};

const FindByIdWithKey = async (Model, objectId, key) => {
  try {
    const id = makeObjectId(objectId);
    const projection = { [key]: 1 };
    const doc = await Model.findById(id, projection);

    if (!doc) throw new Error("doc not found!");

    if (key in doc) return doc[key];
  } catch (error) {
    logger.error(error);
  }
};

const FindAndSort = async (Model, filter, projection = {}, sort = {}) => {
  try {
    const query = Model.find(filter, projection);

    const docs = await query.exec();

    return docs.sort(sort);
  } catch (error) {
    logger.error(error);
  }
};

const Aggregate = async (Model, pipeline) => {
  try {
    return await Model.aggregate(pipeline);
  } catch (error) {
    logger.error(error);
  }
};

const MultiAggregate = async (Model, pipelines) => {
  try {
    return await Promise.all(
      pipelines.map((pipeline) => Aggregate(Model, pipeline))
    );
  } catch (error) {
    logger.error(error);
  }
};

const UpdateOne = async (Model, filter, update, options = {}) => {
  try {
    return await Model.updateOne(filter, update, options);
  } catch (error) {
    logger.error(error);
  }
};

const UpdateMany = async (Model, filter, update, options = {}) => {
  try {
    return await Model.updateMany(filter, update, options);
  } catch (error) {
    logger.error(error);
  }
};

const FindOneAndUpdate = async (
  Model,
  filter,
  update,
  projection = {},
  sort = {}
) => {
  try {
    const updatedDoc = await Model.findOneAndUpdate(
      filter,
      update,
      projection
    ).sort(sort);

    if (!updatedDoc) {
      throw new Error("doc not found or failed to update");
    }

    return updatedDoc;
  } catch (error) {
    logger.error(error);
  }
};

const FindByIdAndUpdate = async (Model, objectId, update, projection = {}) => {
  try {
    const id = makeObjectId(objectId);

    const updatedDoc = await Model.findByIdAndUpdate(id, update, projection);

    if (!updatedDoc) {
      throw new Error("doc not found or failed to update");
    }

    return updatedDoc;
  } catch (error) {
    logger.error(error);
  }
};

const Delete = async (Model, filter) => {
  try {
    return await Model.deleteMany(filter);
  } catch (error) {
    logger.error(error);
  }
};

const DeleteOne = async (Model, filter) => {
  try {
    return await Model.deleteOne(filter);
  } catch (error) {
    logger.error(error);
  }
};

const DeleteById = async (Model, id) => {
  try {
    return await Model.findByIdAndRemove(id);
  } catch (error) {
    logger.error(error);
  }
};

const Count = async (Model, filter) => {
  try {
    const count = await Model.countDocuments(filter);
    return count;
  } catch (error) {
    logger.error(error);
  }
};

module.exports = {
  Create,
  Find,
  FindOne,
  FindOneWithKey,
  FindById,
  FindByIdWithKey,
  FindAndSort,
  Aggregate,
  MultiAggregate,
  UpdateOne,
  UpdateMany,
  FindOneAndUpdate,
  FindByIdAndUpdate,
  Delete,
  DeleteOne,
  DeleteById,
  Count,
};