const { makeObjectId } = require("./global.functions");

const Match = (query, value) => {
  query.push({ $match: value });
};

const ExactMatch = (query, field, value) => {
  const match = { [field]: value };
  query.push({ $match: match });
};

const InMatch = (query, field, values) => {
  const match = { [field]: { $in: values } };
  query.push({ $match: match });
};

const NotInMatch = (query, field, values) => {
  const match = { [field]: { $nin: values } };
  query.push({ $match: match });
};

const IDMatch = (query, field, value) => {
  const match = { [field]: makeObjectId(value) };
  query.push({ $match: match });
};

const NEMatch = (query, field, value) => {
  const match = { [field]: { $ne: value } };
  query.push({ $match: match });
};

const DateMatch = (query, field, startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setDate(end.getDate() + 1);

  const match = {
    [field]: {
      $gte: start,
      $lt: end,
    },
  };

  query.push({ $match: match });
};

const NotNullMatch = (query, field) => {
  const match = { [field]: { $exists: true, $nin: [null, ""] } };
  query.push({ $match: match });
};

const RegexMatch = (query, field, pattern) => {
  const match = { [field]: { $regex: pattern, $options: "i" } };
  query.push({ $match: match });
};

const LEMatch = (query, field, value) => {
  const match = { [field]: { $lte: value } };
  query.push({ $match: match });
};

const GEMatch = (query, field, value) => {
  const match = { [field]: { $gte: value } };
  query.push({ $match: match });
};

const RegexSearch = (query, fields, pattern) => {
  const or = fields.map((field) => ({
    [field]: {
      $regex: pattern,
      $options: "i",
    },
  }));

  query.push({
    $match: {
      $or: or,
    },
  });
};

const Lookup = (query, fromCollection, localField, foreignField, as) => {
  query.push({
    $lookup: {
      from: fromCollection,
      localField: localField,
      foreignField: foreignField,
      as: as,
    },
  });
};

const LookupWithPipeline = (query, fromCollection, let, pipeline, as) => {
  query.push({
    $lookup: {
      from: fromCollection,
      let: let,
      pipeline: pipeline,
      as: as,
    },
  });
};

const Unwind = (query, field) => {
  query.push({
    $unwind: {
      path: field,
      preserveNullAndEmptyArrays: true,
    },
  });
};

const AddFields = (query, fieldName, value) => {
  const addFields = { [fieldName]: value };
  query.push({
    $addFields: addFields,
  });
};

const Project = (query, fields) => {
  query.push({
    $project: fields,
  });
};

const Group = (query, fields) => {
  query.push({
    $group: fields,
  });
};

const Facet = (query, fields) => {
  query.push({
    $facet: fields,
  });
};

const Sort = (query, options) => {
  query.push({
    $sort: options,
  });
};

const Limit = (query, value) => {
  query.push({
    $limit: value,
  });
};

const Skip = (query, count) => {
  query.push({
    $skip: count,
  });
};

const Count = (query, value) => {
  query.push({
    $count: value,
  });
};

const Set = (query, fields) => {
  query.push({
    $set: fields,
  });
};

const ReplaceRoot = (query, value) => {
  query.push({
    $replaceRoot: {
      newRoot: value,
    },
  });
};

const AddWindowFields = (query, fieldName, sortBy, windowOperator) => {
  const setWindowFieldsStage = {
    $setWindowFields: {
      sortBy: sortBy,
      output: {
        [fieldName]: windowOperator,
      },
    },
  };
  query.push(setWindowFieldsStage);
};

module.exports = {
  Match,
  ExactMatch,
  InMatch,
  NotInMatch,
  IDMatch,
  DateMatch,
  NotNullMatch,
  RegexMatch,
  NEMatch,
  LEMatch,
  GEMatch,
  RegexSearch,
  Lookup,
  LookupWithPipeline,
  Unwind,
  AddFields,
  Project,
  Group,
  Facet,
  Sort,
  Limit,
  Skip,
  Count,
  Set,
  ReplaceRoot,
  AddWindowFields,
};