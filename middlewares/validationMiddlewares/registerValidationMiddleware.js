const { body } = require('express-validator');

const registerValidationMiddleware = [
  body('shopName').notEmpty().withMessage('Shop name missing'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('password must be atleast 6 characters'),
];

module.exports = {
  registerValidationMiddleware,
};
