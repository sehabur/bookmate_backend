const { body } = require('express-validator');

const userUpdateValidationMiddleware = [
  body('shopName').notEmpty().withMessage('Shop name missing'),
  body('email').notEmpty().withMessage('Valid email required'),
];

module.exports = {
  userUpdateValidationMiddleware,
};
