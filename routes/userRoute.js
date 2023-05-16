const express = require('express');

const router = express.Router();

const {
  login,
  register,
  getUserProfileById,
  getAllUserProfile,
  updateUserProfile,
  changePassword,
  resetPasswordLink,
  setNewPassword,
} = require('../controllers/userController');

const { checkLogin } = require('../middlewares/authMiddleware');

const { fileUpload } = require('../middlewares/fileUpload');
const {
  registerValidationMiddleware,
} = require('../middlewares/validationMiddlewares/registerValidationMiddleware');
const {
  userUpdateValidationMiddleware,
} = require('../middlewares/validationMiddlewares/userUpdateValidationMiddleware');

router.post('/login', login);

router.post('/register', registerValidationMiddleware, register);

router
  .route('/profile/:id')
  .get(checkLogin, getUserProfileById)
  .patch(
    checkLogin,
    fileUpload.single('image'),
    userUpdateValidationMiddleware,
    updateUserProfile
  );

router.route('/allUsers').get(getAllUserProfile);

router.post('/changePassword', checkLogin, changePassword);

router.post('/resetPasswordLink', resetPasswordLink);

router.post('/setNewPassword', setNewPassword);

module.exports = router;
