const { check } = require('express-validator');

const postValidationMiddleware = [
  check('category').notEmpty().withMessage('Category field missing'),
  check('writer').notEmpty().withMessage('Writer field missing'),
  check('title').notEmpty().withMessage('Title field missing'),
  // check('description').notEmpty().withMessage('Description field missing'),
  check('division').notEmpty().withMessage('Division field missing'),
  check('district').notEmpty().withMessage('District field missing'),
  check('area').notEmpty().withMessage('Area field missing'),
];

module.exports = {
  postValidationMiddleware,
};
