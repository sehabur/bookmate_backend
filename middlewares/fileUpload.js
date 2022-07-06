const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const MIME_TYPE_MAP = {
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpg',
  'image/png': 'png',
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images');
  },
  filename: function (req, file, cb) {
    cb(null, uuidv4() + '.' + MIME_TYPE_MAP[file.mimetype]);
  },
});

const fileUpload = multer({
  storage,
  limits: 500000,
});

module.exports = fileUpload;
