const express = require('express');

const router = express.Router();

const {
  login,
  register,
  getUserProfileById,
  updateUserProfile,
} = require('../controllers/userController');

const { checkLogin } = require('../middlewares/authMiddleware');
const {
  registerValidationMiddleware,
} = require('../middlewares/validationMiddlewares/registerValidationMiddleware');

router.post('/login', login);

router.post('/register', registerValidationMiddleware, register);

router
  .route('/profile/:id')
  .get(checkLogin, getUserProfileById)
  .put(checkLogin, updateUserProfile);

module.exports = router;
