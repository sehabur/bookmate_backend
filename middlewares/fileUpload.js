const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');

const MIME_TYPE_MAP = {
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpg',
  'image/png': 'png',
};
const awsBucket = process.env.AWS_BUCKET_NAME || 'boi-exchange';
const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const storage = multer.memoryStorage();

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
        Bucket: awsBucket,
        Body: file.buffer,
        Key: 'images/' + uuidv4() + '.' + MIME_TYPE_MAP[file.mimetype],
      })
      .promise();

    return imageUploadResult;
  } catch (err) {
    console.log(err);
  }
};

const fileDeleteAwsS3 = (key) => {
  try {
    const s3 = new AWS.S3({
      accessKeyId,
      secretAccessKey,
    });
    return s3
      .deleteObject({
        Bucket: awsBucket,
        Key: key,
      })
      .promise();
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  fileUpload,
  fileUploadToAwsS3,
  fileDeleteAwsS3,
};
