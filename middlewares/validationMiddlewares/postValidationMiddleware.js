const { body } = require('express-validator');

const postValidationMiddleware = [
  body('category').notEmpty().withMessage('Category field missing'),
  body('subCategory').notEmpty().withMessage('Sub-category field missing'),
  body('title').notEmpty().withMessage('Title field missing'),
  body('description').notEmpty().withMessage('Description field missing'),
  body('price')
    .notEmpty()
    .isNumeric()
    .withMessage('price field is required as number'),
  body('image1').notEmpty().withMessage('At least 1 image required'),
  body('division').notEmpty().withMessage('Division field missing'),
  body('district').notEmpty().withMessage('District field missing'),
  body('area').notEmpty().withMessage('Area field missing'),
  body('enableExchangeOffer')
    .notEmpty()
    .isBoolean()
    .withMessage('Enable Exchange Offer field is required as boolean'),
];

module.exports = {
  postValidationMiddleware,
};
