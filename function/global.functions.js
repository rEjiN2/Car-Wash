const mongoose = require("mongoose");
const { default: axios } = require("axios");
const { log: info, error: _error } = console;
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const sharp = require("sharp");
const Papa = require("papaparse");
const XLSX = require("xlsx");
const ExcelJS = require("exceljs");
const AWS = require("aws-sdk");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const config = require("../config");
const logger = require("../config/logger");
const rateLimit = require("express-rate-limit");
const { promisify } = require("util");
const {
  add,
  sub,
  format,
  parse,
  parseISO,
  differenceInCalendarDays,
  startOfDay,
  endOfDay,
  subHours,
} = require("date-fns");

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESSKEYID,
  secretAccessKey: process.env.AWS_SECRETACCESSKEY,
});

const aws_bucket = process.env.AWS_BUCKET;
const s3 = new AWS.S3();

const isNumberLessThanZero = (number) => number < 0;
const makeAbsoluteNumber = (number) => Math.abs(number);
const regexSearch = (str) => ({ $regex: str, $options: "i" });
const isArrayWithLength = (arr) => Array.isArray(arr) && arr.length > 0;
const sendDummyResponse = (res) => res.status(200).send("OK!");
const isEmptyArray = (value) => Array.isArray(value) && value.length === 0;
const isUndefined = (value) => value === undefined;
const isNull = (value) => value === null;
const isBoolean = (value) => typeof value === "boolean";
const isMongooseObjectId = (value) => mongoose.Types.ObjectId.isValid(value);
const handleNegativeNumber = (number) => (number < 0 ? 0 : number);
const calculatePercentage = (amount, percentage) => (amount * percentage) / 100;
const readFileAsync = promisify(fs.readFile);
const unlinkAsync = promisify(fs.unlink);
const accessAsync = promisify(fs.access);

const makeObjectId = (id) => {
  if (!id) return;

  return mongoose.Types.ObjectId(id);
};

const getFivePercentVat = (amount) => {
  const vat = 0.05 * amount;
  return roundToDecimal(vat, 2);
};

const getTwoPercentVat = (amount) => {
  const vat = 0.02 * amount;
  return roundToDecimal(vat, 2);
};

const getAmountWithVat = (totalAmount, vatRate = config.defaultVat) => {
  if (totalAmount <= 0 || vatRate <= 0)
    return {
      amount: 0,
      vat: 0,
    };

  const amount = totalAmount / (1 + vatRate / 100);
  const vat = totalAmount - amount;

  return {
    amount,
    vat,
  };
};

const combineObjects = (data) => {
  return data.reduce((combinedObject, currentObject) => {
    return { ...combinedObject, ...currentObject };
  }, {});
};

const createNewMongoDoc = (doc) => {
  const { _id, createdAt, updatedAt, __v, ...rest } = doc.toObject();
  return rest;
};

const removeFieldsFromObject = (object, ...keys) =>
  keys.reduce((obj, key) => {
    const { [key]: _, ...rest } = obj;
    return rest;
  }, object);

const checkBoolean = (input) => {
  if (!input) return false;

  if (typeof input === "boolean") return input;

  if (typeof input === "string") {
    if (input === "true") return true;
    else if (input === "false") return false;
  }
};

const generateOTP = (length) => {
  const characters = "0123456789";
  let otp = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    otp += characters[randomIndex];
  }
  otp = 4321;
  return otp;
};

const parseCSVFile = async (filePath) => {
  if (!filePath) return;

  try {
    const data = await fs.readFileSync(filePath, "utf8");

    const results = await new Promise((resolve, reject) => {
      Papa.parse(data, {
        header: true,
        dynamicTyping: false,
        skipEmptyLines: true,
        complete: function (results) {
          resolve(results.data);
        },
        error: function (error) {
          reject(error.message);
        },
      });
    });

    return results;
  } catch (error) {
    _error("error in parseCSVFile with: ", error.message);
  }
};

const parseLeadsCSVFile = async (filePath) => {
  if (!filePath) return;

  try {
    // Read the file with proper encoding
    const data = await fs.promises.readFile(filePath, "utf-8");

    const results = await new Promise((resolve, reject) => {
      Papa.parse(data, {
        header: true,
        dynamicTyping: false,
        skipEmptyLines: "greedy",
        encoding: "UTF-8",
        transformHeader: (header) => {
          // Remove BOM and trim whitespace
          return header.replace(/^\uFEFF/, "").trim();
        },
        transform: (value) => {
          // Handle empty or undefined values
          if (value === undefined || value === null) {
            return "";
          }
          // Ensure proper string handling
          return value.toString().trim();
        },
        complete: function (results) {
          // Filter out completely empty rows
          const filteredData = results.data.filter((row) =>
            Object.values(row).some((value) => value && value.trim() !== "")
          );
          resolve(filteredData);
        },
        error: function (error) {
          reject(error.message);
        },
      });
    });

    return results;
  } catch (error) {
    _error("error in parseCSVFile with: ", error.message);
    throw error;
  }
};

const fileCleaner = async (file) => {
  if (!file) return;

  try {
    await fs.unlink(`./${file.path}`, (err) => {
      if (err) {
        _error(
          `Error while cleaning single file with this path ===>- ./${file.path}`
        );
      } else {
        info(`File deleted on this path ===> - ./${file.path}`);
      }
    });
  } catch (error) {
    _error(
      `Error catch while cleaning single file with this path - ./${file.path}`
    );
  }
};

const removeFileByPath = (filePath) => {
  try {
    fs.unlinkSync(filePath);
    info(`File ${filePath} has been removed successfully.`);
  } catch (err) {
    _error(`Error removing file ${filePath}: ${err.message}`);
  }
};

const removeFilesByPaths = (filePaths) => {
  filePaths.forEach((filePath) => {
    removeFileByPath(filePath);
  });
};

const findAndJoinByKey = (arr, key) => {
  if (!arr.length) return [];

  const values = arr.map((obj) => obj[key]);
  const joinedValues = values.join(", ");

  return joinedValues;
};

const joinWithSymbol = (symbol, ...args) => {
  const strings = args.filter((str) => str !== "" && str !== null);

  if (strings.length === 0) return "";

  const joinedString = strings.join(`${symbol}`);
  return joinedString;
};

const isEmptyString = (value) => {
  return typeof value === "string" && value.trim() === "";
};

const isEmptyObject = (value) => {
  return (
    typeof value === "object" &&
    Object.keys(value).length === 0 &&
    !(value instanceof mongoose.Types.ObjectId)
  );
};

const checkRequiredArguments = (...args) => {
  return args.every(
    (arg) =>
      !isUndefined(arg) &&
      !isNull(arg) &&
      !isEmptyString(arg) &&
      !isEmptyObject(arg) &&
      !isEmptyArray(arg)
  );
};

const createDirectory = (dir) => {
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  } catch (err) {
    _error(`Error creating directory: ${err.message}`);
  }
};

const resizeImage = async (imagePath, outputDir) => {
  try {
    if (!checkRequiredArguments(imagePath, outputDir)) return;
    createDirectory(outputDir);

    const { imageResizeDimensions: dimensions } = config;
    const image = sharp(imagePath);

    const resizedImagePaths = [];

    for (const dimension of dimensions) {
      const { name, width, height } = dimension;
      const outputFilename = `${name}-${path.basename(imagePath)}`;
      const outputPath = path.join(outputDir, outputFilename);
      const options = {
        fit: "inside",
        withoutEnlargement: true,
      };

      try {
        await image.resize(width, height, options).toFile(outputPath);

        resizedImagePaths.push({
          path: outputPath,
          size: name,
        });
      } catch (err) {
        _error(`Error resizing image to ${width}x${height}: ${err.message}`);
      }
    }

    removeFileByPath(imagePath);
    return resizedImagePaths;
  } catch (err) {
    _error(`Error resizing image: ${err.message}`);
    return [];
  }
};

const getSapOriginalAmount = (finalAmount, chargePercentage) => {
  const percentageMultiplier = 1 + chargePercentage / 100;
  console.log(percentageMultiplier, chargePercentage, "per");

  console.log(finalAmount / percentageMultiplier, "perc");

  return finalAmount / percentageMultiplier;
};

const getValuesByKey = (arr, key, mode) => {
  if (!checkRequiredArguments(arr, key, mode)) return;

  const values = arr
    .map((obj) => obj[key])
    .filter((value) => value !== undefined);

  const [value = ""] = values;
  return mode === "single" ? value : values;
};

const customSort = (key, order) => {
  return (a, b) => {
    const indexA = order.indexOf(a[key]);
    const indexB = order.indexOf(b[key]);

    if (indexA === -1) return 1;
    if (indexB === -1) return -1;

    return indexA - indexB;
  };
};

const roundToDecimal = (number, decimalPlaces = 0) => {
  const factor = 10 ** decimalPlaces;
  return Math.round(number * factor) / factor;
};

const ceilToDecimal = (number, decimalPlaces = 0) => {
  const factor = 10 ** decimalPlaces;
  return Math.ceil(number * factor) / factor;
};

const customSlice = (str, type, count) => {
  if (!checkRequiredArguments(str, type, count)) return;

  if (type === "start") {
    return str.slice(0, count);
  } else if (type === "end") {
    return str.slice(-count);
  } else {
    return "Invalid type!";
  }
};

const detectDateFormat = (date) => {
  const dateFormats = Object.values(config.dateFormats);

  for (const format of dateFormats) {
    const parsedDate = parse(date, format, new Date());

    if (!isNaN(parsedDate)) {
      return format;
    }
  }

  return config.dateFormats.ISO8601;
};

const convertDateFormat = (date, sourceFormat, targetFormat) => {
  const parsedDate = parse(date, sourceFormat, new Date());

  if (isNaN(parsedDate)) {
    return "Invalid date!";
  }

  const formattedDate = format(parsedDate, targetFormat);
  return formattedDate;
};

const formatDate = (date, formate = config.dateFormats.ISO8601) => {
  if (!date) return;

  const parsedDate = typeof date === "string" ? parseISO(date) : date;
  if (isNaN(parsedDate)) return "Invalid date!";
  return format(parsedDate, formate);
};

const daysPassedFromToday = (targetDate) => {
  if (!targetDate) return;

  const currentDate = new Date();
  const daysPassed = differenceInCalendarDays(currentDate, targetDate);
  return daysPassed;
};

const manipulateDate = (
  date,
  operation,
  value,
  formate = config.dateFormats.ISO8601
) => {
  const parsedDate = typeof date === "string" ? parseISO(date) : date;

  if (isNaN(parsedDate)) return "Invalid date!";

  let manipulatedDate;
  if (operation === "add") {
    manipulatedDate = add(parsedDate, { days: value });
  } else if (operation === "subtract") {
    manipulatedDate = sub(parsedDate, { days: value });
  } else {
    return 'Invalid operation. Use "add" or "subtract"';
  }

  return format(manipulatedDate, formate);
};

const todayDate = (formate = config.dateFormats.ISO8601) => {
  const date = new Date();
  const formattedDate = format(date, formate);
  return formattedDate;
};

const uniqueItemsToArray = (...args) => {
  return Array.from(new Set(args)).filter(Boolean);
};

const removeSpaces = (str) => {
  if (!checkRequiredArguments(str)) return;

  return str.replace(/ /g, "");
};

const makeObjectIds = (ids) => {
  if (!checkRequiredArguments(ids)) return;

  return ids.map((id) => mongoose.Types.ObjectId(id));
};

const makeAxiosRequest = async (
  url,
  method,
  data = null,
  headers = {},
  params = {}
) => {
  // info(`sending axios request to url: ${url}`);
  // info(`sending axios request with method: ${method}`);
  // info(`sending axios request with data: ${JSON.stringify(data)}`);
  // info(`sending axios request with headers: ${JSON.stringify(headers)}`);
  // info(`sending axios request with params: ${JSON.stringify(params)}`);

  try {
    const response = await axios({
      url,
      method,
      data,
      headers,
      params,
    });

    return response.data;
  } catch (error) {
    // _error(error);
    return error;
  }
};

const bearerToken = (token) => {
  if (!checkRequiredArguments(token)) return;

  return {
    Authorization: `Bearer ${token}`,
  };
};

const isValidEmail = (email) => {
  if (!checkRequiredArguments(email)) return;
  const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  return regex.test(email);
};

const isEmailDomainAllowed = (email) => {
  if (!email) return false;
  for (const domain of config.restrictedEmailDomains) {
    if (email.toLowerCase().endsWith(domain)) return false;
  }
  return true;
};

const removeSpecialCharacters = (str) => {
  if (!checkRequiredArguments(str)) return;

  return str.replace(/[^\w\s]/g, "");
};

const onlyNumbersString = (str) => {
  if (!checkRequiredArguments(str)) return;

  const pattern = /^\d+$/;
  return pattern.test(str);
};

const baseUrlWithoutParams = (url) => {
  if (!checkRequiredArguments(url)) return;

  const baseUrl = url.replace(/\/\w+$/, "");
  return baseUrl;
};

const toUpperCase = (str) => {
  if (!checkRequiredArguments(str)) return;

  return str.toUpperCase();
};

const toLowerCase = (str) => {
  if (!checkRequiredArguments(str)) return;

  return str.toLowerCase();
};

const findByKeyValue = (arr, key, value) => {
  if (!checkRequiredArguments(arr, key, value)) return;

  return arr.find((obj) => {
    if (obj[key] instanceof mongoose.Types.ObjectId) {
      return obj[key].equals(value);
    } else {
      return obj[key] === value;
    }
  });
};

const filterFalsyValues = (arr) => {
  if (!checkRequiredArguments(arr)) return;

  return Array.isArray(arr) ? arr.filter(Boolean) : [];
};

const compareObjectIds = (sourceId, targetId, checkEquality = true) => {
  if (!checkRequiredArguments(sourceId, targetId)) return;

  const sourceID = makeObjectId(sourceId);
  const targetID = makeObjectId(targetId);

  if (checkEquality) {
    return sourceID.equals(targetID);
  } else {
    return !sourceID.equals(targetID);
  }
};

const calculateTimeDifference = (
  source,
  target = new Date(),
  unit = "second"
) => {
  const conversionFactors = {
    second: 1000,
    minute: 60 * 1000,
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    year: 365 * 24 * 60 * 60 * 1000,
  };

  const factor = conversionFactors[unit] || 1;

  return Math.floor((target - source) / factor);
};

const handleStatus = (status, message) => ({
  status,
  message: message || "",
});

const debounce = (delay = 2000) => {
  return new Promise((resolve) => {
    setTimeout(resolve, delay);
  });
};

const throttle = (fn, delay = 2000) => {
  let lastCallTime = 0;

  return async (req, res) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    if (timeSinceLastCall < delay) {
      await new Promise((resolve) =>
        setTimeout(resolve, delay - timeSinceLastCall)
      );
    }

    lastCallTime = now;
    await fn(req, res);
  };
};

const createMutex = () => {
  let isLocked = false;

  return async (req, res, next) => {
    if (isLocked) {
      return res
        .status(429)
        .json({ message: "Request in progress. Please wait." });
    }

    isLocked = true;

    res.on("finish", () => {
      isLocked = false;
    });

    next();
  };
};

const rateLimiter = (ms = 5) =>
  rateLimit({
    windowMs: ms * 1000, // * 5 seconds
    max: 1, // * limit each IP to 1 request per windowMs
    handler: (req, res) => {
      res.status(200).json({
        status: false,
        message:
          "Our system has detected an unusually high number of requests. Please wait a short while and try again. We appreciate your patience.",
      });
    },
    keyGenerator: (req) => `${req.ip}-${req.path}`, // * generate a key based on IP and route
    skipFailedRequests: true,
  });

const readFile = (outputPath) => {
  const filePath = path.resolve(outputPath);
  const content = fs.readFileSync(filePath);
  return content;
};

const createWorksheet = (workbook, sheetName, columns) => {
  const worksheet = workbook.addWorksheet(sheetName);
  worksheet.columns = columns;
  return worksheet;
};

const addDataToWorksheet = (worksheet, data, columnWidth = 15) => {
  data.forEach((row) => {
    worksheet.addRow(row);
  });

  worksheet.columns.forEach((column) => {
    column.width = columnWidth;
  });

  worksheet.eachRow({ includeEmpty: true }, (row) => {
    row.eachCell((cell) => {
      cell.alignment = { vertical: "top", horizontal: "left" };
    });
  });
};

const saveWorkbook = async (workbook, outputPath) => {
  try {
    const absolutePath = path.resolve(outputPath);
    await workbook.xlsx.writeFile(absolutePath);

    return handleStatus(
      true,
      `File successfully saved to this destination ${absolutePath}`
    );
  } catch (err) {
    return handleStatus(false, `Error while saving file!`);
  }
};

const generateExcelFile = async (sheetName, columns, data, outputFilename) => {
  const workbook = new ExcelJS.Workbook();

  const worksheet = createWorksheet(workbook, sheetName, columns);
  addDataToWorksheet(worksheet, data);

  const tempPath = createTempPublicPath(outputFilename);
  await saveWorkbook(workbook, tempPath);

  return tempPath;
};

const addNumbers = (...numbers) => {
  if (!numbers.every((num) => typeof num === "number")) {
    return 0;
  }

  return numbers.reduce((acc, curr) => acc + curr, 0);
};

const getFileSize = (filePath, conversionUnit = "MB") => {
  try {
    if (!fs.existsSync(filePath)) {
      return handleStatus(false, "File not found!");
    }

    const conversionFactors = {
      B: 1,
      KB: 1024,
      MB: 1024 ** 2,
      GB: 1024 ** 3,
      TB: 1024 ** 4,
      PB: 1024 ** 5,
    };

    const fileSizeInBytes = fs.statSync(filePath).size;

    const convertedSize = fileSizeInBytes / conversionFactors[conversionUnit];

    const roundedSize = Math.round(convertedSize * 100) / 100;

    const readableSize = `${roundedSize} ${conversionUnit}`;

    return {
      status: true,
      size: roundedSize,
      readable: readableSize,
    };
  } catch (error) {
    logger.error(`Error getting file size: ${error}`);
  }
};

const getDateRange = (date = new Date()) => {
  const start = startOfDay(date);
  const end = endOfDay(date);

  return { start, end };
};

const areSetsEqual = (setA, setB) => {
  if (setA.size !== setB.size) return false;

  for (const item of setA) if (!setB.has(item)) return false;

  return true;
};

// * later on found that XLSX should be used!
const convertXlsxToCsv = (inputPath, outputPath) => {
  const workbook = XLSX.readFile(inputPath);
  const sheetName = workbook.SheetNames[0];
  const csvData = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);
  fs.writeFileSync(outputPath, csvData);

  logger.info(`XLSX converted to CSV and saved to ${outputPath}`);
};

const getTodayAndTomorrowDate = () => {
  const date = new Date();

  const today = new Date(date.setHours(0, 0, 0, 0));
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return { today, tomorrow };
};

const getSalesDateRange = (period, date) => {
  if (!period || !date) {
    throw new Error("Period and date must be provided");
  }

  const startDate = new Date(date);
  if (isNaN(startDate.getTime())) {
    throw new Error("Invalid date provided");
  }

  startDate.setHours(0, 0, 0, 0);
  let endDate = new Date(startDate);

  switch (period.toLowerCase()) {
    case "daily":
      endDate.setDate(endDate.getDate() + 1);
      break;
    case "monthly":
      startDate.setDate(1);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);
      break;
    case "yearly":
      startDate.setMonth(0, 1);
      endDate.setFullYear(endDate.getFullYear() + 1);
      endDate.setMonth(0, 0);
      break;
    default:
      throw new Error("Invalid period specified: " + period);
  }

  return { startDate, endDate };
};

const formatToSpecifiedTimezone = (date, timezone) => {
  try {
    const formattedDate = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(date);

    const formattedParts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(date);

    const year = formattedParts.find((part) => part.type === "year").value;
    const month = formattedParts.find((part) => part.type === "month").value;
    const day = formattedParts.find((part) => part.type === "day").value;
    const hour = formattedParts.find((part) => part.type === "hour").value;
    const minute = formattedParts.find((part) => part.type === "minute").value;
    const second = formattedParts.find((part) => part.type === "second").value;

    const isoDate = `${year}-${month}-${day}T${hour}:${minute}:${second}`;

    return {
      formattedTime: formattedDate, // e.g., "10/07/2024, 18:13:25"
      isoFormattedTime: isoDate, // e.g., "2024-10-07T18:13:25.000Z"
    };
  } catch (error) {
    return "";
  }
};

const pickEntries = (object, keys) => {
  return keys.reduce((obj, key) => {
    if (object) {
      obj[key] = object[key];
    }
    return obj;
  }, {});
};

const convertToString = (value) => {
  if (isEmptyString(value)) return "";

  if (typeof value === "object") {
    return JSON.stringify(value, (key, val) =>
      typeof val === "object" && val !== null
        ? JSON.stringify(val)
        : String(val)
    );
  }

  return String(value);
};

const findChangesInObject = (prevObj, updatedObj) => {
  const changes = {};

  const allKeys = new Set([
    ...Object.keys(prevObj),
    ...Object.keys(updatedObj),
  ]);

  allKeys.forEach((key) => {
    const str1 = convertToString(prevObj[key]);
    const str2 = convertToString(updatedObj[key]);

    if (str1 !== str2) {
      changes[key] = {
        oldValue: prevObj[key],
        newValue: updatedObj[key],
      };
    }
  });

  return changes;
};

const dynamicSort = (data = {}) => {
  const { sortKey = "createdAt", sortOrder } = data;
  const validSortOrder = Number(sortOrder) === 1 ? 1 : -1;
  return { [sortKey]: validSortOrder };
};

const groupByKey = (array, key) => {
  return array.reduce((result, item) => {
    const keyValue = item[key];

    if (!result[keyValue]) {
      result[keyValue] = [];
    }

    result[keyValue].push(item);
    return result;
  }, {});
};

const determineFileType = (mimetype) => {
  const typeMap = new Map([
    ["image", "image/"],
    ["video", "video/"],
    ["audio", "audio/"],
    ["pdf", "application/pdf"],
  ]);

  for (const [type, prefix] of typeMap) {
    if (mimetype.startsWith(prefix)) {
      return type;
    }
  }

  return "file";
};

const generateUniqueId = (byteSize = 32) => {
  return crypto.randomBytes(byteSize).toString("hex");
};

const commonAwsFileUploader = async (files) => {
  const uploadResults = [];

  for (const file of files) {
    const { filename: fileName, path: filePath, mimetype: mimeType } = file;
    const currentDate = new Date();

    let uploadPath = "assets";
    let fileType = "file";

    if (mimeType.startsWith("image/")) {
      uploadPath = "assets/image";
      fileType = "image";
    } else if (mimeType.startsWith("video/")) {
      uploadPath = "assets/video";
      fileType = "video";
    } else if (mimeType === "application/pdf") {
      uploadPath = "assets/pdf";
      fileType = "pdf";
    } else if (["audio/mpeg", "audio/wav", "audio/mp3"].includes(mimeType)) {
      uploadPath = "assets/audio";
      fileType = "audio";
    } else {
      uploadPath = "assets/file";
    }

    uploadPath += `/${currentDate.getFullYear()}/${
      currentDate.getMonth() + 1
    }/${currentDate.getDate()}`;
    const s3Key = `${uploadPath}/${Date.now()}-${path.basename(fileName)}`;
    const params = {
      Bucket: aws_bucket,
      Key: s3Key,
      Body: fs.createReadStream(filePath),
      ACL: "public-read",
      ContentType: mimeType,
    };

    try {
      const data = await s3.upload(params).promise();
      uploadResults.push({
        fileName,
        url: data.Location,
        uploadPath,
        type: fileType,
      });
    } catch (error) {
      logger.error(`Error uploading ${fileName}: ${error.message}`);
      uploadResults.push({
        fileName,
        error: error.message,
        type: fileType,
      });
    } finally {
      fs.unlink(filePath, (err) => {
        if (err) console.error(`Error deleting file ${filePath}:`, err);
      });
    }
  }

  return uploadResults;
};

const validateField = (value, fieldName, expectedType = "any") => {
  if (value == null || value === "") {
    return { isValid: false, message: `${fieldName} is required!` };
  }

  if (expectedType !== "any" && typeof value !== expectedType) {
    return {
      isValid: false,
      message: `${fieldName} must be a valid ${expectedType}!`,
    };
  }

  if (expectedType === "number" && isNaN(value)) {
    return { isValid: false, message: `${fieldName} must be a valid number!` };
  }

  return { isValid: true, message: `${fieldName} is valid.` };
};

const createTempPublicPath = (outputPath) => {
  const PATH = "/public/temp/";

  const directoryPath = path.join(process.cwd(), PATH);
  const filePath = path.join(directoryPath, outputPath);
  return filePath;
};

const generateSecretKey = (options) => {
  return speakeasy.generateSecret(options);
};

const generateQrCode = async (url) => {
  return await qrcode.toDataURL(url);
};

const _determineFileType = async (buffer) => {
  const { fileTypeFromBuffer } = await import("file-type");
  return await fileTypeFromBuffer(buffer);
};

const transformToISODate = (dateString) => {
  // Split the date string into day, month, and year
  const [day, month, year] = dateString.split("/").map(Number);

  // Create a new Date object in the ISO format (YYYY-MM-DD)
  return new Date(year, month - 1, day); // Month is 0-indexed
};

const validateAndTransformDate = (dateString) => {
  if (!dateString) return null; // Return null for empty or missing dates

  // Check if the date is in DD/MM/YYYY or DD.MM.YYYY format
  const regex = /^(\d{2})[\/.](\d{2})[\/.](\d{4})$/; // Matches both DD/MM/YYYY and DD.MM.YYYY
  const match = dateString.match(regex);

  if (match) {
    const [_, day, month, year] = match;
    const formattedDate = `${year}-${month}-${day}`; // Convert to ISO format (YYYY-MM-DD)
    const date = new Date(formattedDate);

    if (!isNaN(date.getTime())) {
      return date; // Return valid Date object
    }
  }

  throw new Error(`Invalid date format: ${dateString}`); // Throw error for invalid format
};

const determineSimpleFileType = (mimetype) => {
  const mimeTypeMap = {
    "image/jpg": "image",
    "image/jpeg": "image",
    "image/png": "image",
    "audio/mp3": "audio",
    "audio/mpeg": "audio",
    "audio/wav": "audio",
    "video/mp4": "video",
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "doc",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      "spreadsheet",
  };

  return mimeTypeMap[mimetype] || null;
};

const safeUnlinkAsync = async (filePath) => {
  try {
    await accessAsync(filePath);
    await unlinkAsync(filePath);
    logger.info(`File successfully removed: ${filePath}`);
  } catch (err) {
    if (err.code === "ENOENT") {
      logger.warn(`File does not exist or already removed: ${filePath}`);
    } else {
      logger.error(`Error during file removal: ${filePath}`, err.message);
    }
  }
};

const subtractHoursFromNow = (hours = 0) => {
  return subHours(new Date(), hours);
};

const toPlainObject = (doc) => {
  if (doc && typeof doc.toObject === "function") {
    return doc.toObject();
  }
  return doc;
};

const getBatchedIterable = async function* (cursor, batchSize) {
  let batch = [];
  let hasNext = false;
  do {
    const item = await cursor.next();

    hasNext = !!item;
    if (hasNext) batch.push(item);

    if (batch.length === batchSize) {
      yield batch;
      batch = [];
    }
  } while (hasNext);

  if (batch.length) yield batch;
};

const firstCharacterCapitalOfEachWord = (str) => {
  if (typeof str !== "string" || str.trim() === "") return "";
  const operator = str.match(/[-_ ]/)?.[0];
  return str
    .split(operator || " ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(operator || " ");
};

const normalizeDate = (dateString) => {
  if (!dateString) return null;

  // Check if date is in YYYY-MM-DD format
  const isNewFormat = /^\d{4}-\d{2}-\d{2}/.test(dateString);

  if (isNewFormat) {
    const [year, month, day] = dateString.split("-");
    return new Date(
      Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day))
    );
  } else {
    // Handle old format (DD-MM-YYYY)
    const [day, month, year] = dateString.split("-");
    return new Date(
      Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day))
    );
  }
};

const isValidDate = (value) => {
  if (!value) return false;
  const date = new Date(value);
  return date instanceof Date && !isNaN(date);
};
// Helper function to format date to YYYY-MM-DD
const formatDateForUserUpdate = (dateValue) => {
  if (!dateValue) return dateValue;
  const date = new Date(dateValue);
  return date.toISOString().split("T")[0];
};
// Helper function to normalize values for comparison
// Helper function to normalize values for comparison
function normalizeValue(value, fieldName) {
  if (config.fieldTypes.dateFields.includes(fieldName) && isValidDate(value)) {
    return formatDate(value);
  }

  if (config.fieldTypes.numericFields.includes(fieldName)) {
    return Number(value);
  }

  if (config.fieldTypes.booleanFields.includes(fieldName)) {
    // Handle string representations of booleans
    if (typeof value === "string") {
      return value.toLowerCase() === "true";
    }
    return Boolean(value);
  }

  return value;
}
// Helper function to format value for display
const formatValueForDisplay = (value, fieldName) => {
  const numericFields = ["userType", "status"];
  if (config.fieldTypes.dateFields.includes(fieldName)) {
    if (isValidDate(value)) {
      return formatDateForUserUpdate(value);
    }
  }
  if (config.fieldTypes.booleanFields.includes(fieldName)) {
    return value;
  }
  if (config.fieldTypes.numericFields.includes(fieldName)) {
    return String(value);
  }
  return value;
};
const getTimeInMs = (value, unit) => {
  const units = {
    minute: 60000,
    hour: 3600000,
    day: 86400000,
  };

  if (!units[unit]) {
    logger.error(`Invalid unit: ${unit}`);
    return null;
  }

  return value * units[unit];
};
const parseJsonIfPossible = (data) => {
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch (error) {
      logger.error(`Invalid JSON string while parsing: ${error}`);
    }
  }
  return data;
};

module.exports = {
  isNumberLessThanZero,
  makeAbsoluteNumber,
  combineObjects,
  createNewMongoDoc,
  removeFieldsFromObject,
  checkBoolean,
  generateOTP,
  makeObjectId,
  getFivePercentVat,
  getTwoPercentVat,
  parseCSVFile,
  fileCleaner,
  removeFileByPath,
  removeFilesByPaths,
  findAndJoinByKey,
  joinWithSymbol,
  checkRequiredArguments,
  createDirectory,
  resizeImage,
  getValuesByKey,
  sendDummyResponse,
  regexSearch,
  isArrayWithLength,
  isUndefined,
  isNull,
  isEmptyString,
  isEmptyObject,
  isEmptyArray,
  isMongooseObjectId,
  customSort,
  roundToDecimal,
  ceilToDecimal,
  customSlice,
  detectDateFormat,
  convertDateFormat,
  formatDate,
  daysPassedFromToday,
  manipulateDate,
  todayDate,
  getAmountWithVat,
  uniqueItemsToArray,
  removeSpaces,
  makeObjectIds,
  makeAxiosRequest,
  bearerToken,
  isValidEmail,
  isEmailDomainAllowed,
  removeSpecialCharacters,
  onlyNumbersString,
  baseUrlWithoutParams,
  toUpperCase,
  toLowerCase,
  findByKeyValue,
  filterFalsyValues,
  compareObjectIds,
  calculateTimeDifference,
  handleNegativeNumber,
  handleStatus,
  debounce,
  throttle,
  createMutex,
  rateLimiter,
  readFile,
  createWorksheet,
  addDataToWorksheet,
  saveWorkbook,
  generateExcelFile,
  addNumbers,
  getFileSize,
  getDateRange,
  isBoolean,
  areSetsEqual,
  convertXlsxToCsv,
  getTodayAndTomorrowDate,
  getSalesDateRange,
  formatToSpecifiedTimezone,
  pickEntries,
  convertToString,
  findChangesInObject,
  calculatePercentage,
  dynamicSort,
  groupByKey,
  determineFileType,
  generateUniqueId,
  commonAwsFileUploader,
  validateField,
  createTempPublicPath,
  generateSecretKey,
  generateQrCode,
  _determineFileType,
  determineSimpleFileType,
  readFileAsync,
  unlinkAsync,
  accessAsync,
  safeUnlinkAsync,
  subtractHoursFromNow,
  toPlainObject,
  getBatchedIterable,
  firstCharacterCapitalOfEachWord,
  normalizeDate,
  normalizeValue,
  formatDateForUserUpdate,
  isValidDate,
  formatValueForDisplay,
  getSapOriginalAmount,
  parseLeadsCSVFile,
  transformToISODate,
  validateAndTransformDate,
  getTimeInMs,
  parseJsonIfPossible,
};