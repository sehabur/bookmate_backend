const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');
const createError = require('http-errors');

const MIME_TYPE_MAP = {
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpg',
  'image/png': 'png',
};

const awsBucket = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

// For AWS S3 cloud storage //
const storage = multer.memoryStorage();

// For disk storage //

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'public/images');
//   },
//   filename: function (req, file, cb) {
//     cb(null, uuidv4() + '.' + MIME_TYPE_MAP[file.mimetype]);
//   },
// });

const fileUpload = multer({
  storage,
  limits: 500000,
});

const fileUploadToAwsS3 = (file) => {
  try {
    const s3 = new AWS.S3({
      accessKeyId,
      secretAccessKey,
    });

    const imageUploadResult = s3
      .upload({
        Bucket: process.env.AWS_BUCKET_NAME,
        Body: file.buffer,
        Key: 'images/' + uuidv4() + '.' + MIME_TYPE_MAP[file.mimetype],
      })
      .promise();

    return imageUploadResult;
  } catch (err) {
    console.log(err);
  }
};

const fileDeleteAwsS3 = (filepath) => {
  try {
    const s3 = new AWS.S3({
      accessKeyId,
      secretAccessKey,
    });
    return s3
      .deleteObject({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: filepath,
      })
      .promise();
  } catch (err) {
    console.log(err);
  }
};

// No use so far //
const getImageFromAwsS3 = async (req, res) => {
  try {
    const imageKey = req.params.image;

    AWS.config.update({
      region,
      accessKeyId,
      secretAccessKey,
    });
    const s3 = new AWS.S3();

    const downloadParams = {
      Key: imageKey,
      Bucket: 'boi-exchange',
    };
    const dataStream = s3.getObject(downloadParams).createReadStream();
    dataStream.pipe(res);
  } catch (err) {
    const error = createError(400, 'Image fetching failed');
    next(error);
  }
};

module.exports = {
  fileUpload,
  fileUploadToAwsS3,
  getImageFromAwsS3,
  fileDeleteAwsS3,
};
