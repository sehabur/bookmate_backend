const { body } = require('express-validator');

const registerValidationMiddleware = [
  body('shopName').notEmpty().withMessage('Username missing'),
  body('email').isEmail().withMessage('Invalid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('password must be atleast 6 characters'),
  body('division').notEmpty().withMessage('Division missing'),
  body('district').notEmpty().withMessage('District missing'),
  body('area').notEmpty().withMessage('Area missing'),
  body('currentInstitution')
    .notEmpty()
    .withMessage('Current Institution missing'),
  body('phoneNo').notEmpty().withMessage('Phone number missing'),
];

module.exports = {
  registerValidationMiddleware,
};
