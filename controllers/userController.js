const createError = require('http-errors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const S3 = require('aws-sdk/clients/s3');
const AWS = require('aws-sdk');

const User = require('../models/userModel');
const Notification = require('../models/notificationModel');
const { fileUploadToAwsS3 } = require('../middlewares/fileUpload');
const { sendMailToUser } = require('../helper');

/*
  @api:       POST /api/users/login/
  @desc:      user login
  @access:    public
*/
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user) {
      result = await bcrypt.compare(password, user.password);
      if (result) {
        res.status(200).json({
          message: 'Login attempt successful.',
          user: {
            id: user.id,
            shopName: user.shopName,
            email,
            token: generateToken(user.id),
            image: user.image,
            isLoggedIn: true,
            division: user.division,
            district: user.district,
            area: user.area,
            currentInstitution: user.currentInstitution,
          },
        });
      } else {
        const error = createError(401, 'Password does not match.');
        next(error);
      }
    } else {
      const error = createError(404, 'User not found');
      next(error);
    }
  } catch (err) {
    const error = createError(500, 'Login failed. Unknown Error');
    next(error);
  }
};

/*
  @api:       POST /api/users/register/
  @desc:      signup for new user
  @access:    public
*/
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json(errors);
    }

    const {
      email,
      password,
      shopName,
      phoneNo,
      division,
      district,
      area,
      currentInstitution,
    } = req.body;

    const userExists = await User.findOne({ email });

    if (!userExists) {
      const newUser = await User.create({
        shopName,
        email,
        password: encriptPassword(password),
        phoneNo,
        division,
        district,
        area,
        currentInstitution,
      });

      res.status(201).json({
        message: 'User creation successful',
        user: {
          shopName,
          email,
        },
      });
    } else {
      const error = createError(400, 'User already exists');
      next(error);
    }
  } catch (err) {
    const error = createError(400, 'Error occured');
    next(error);
  }
};

/*
  @api:       GET /api/users/profile/:id
  @desc:      get user profile of a specific user
  @access:    private
*/
const getUserProfileById = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select('-password -__v');

    if (user) {
      res.status(200).json({ user });
    } else {
      const error = createError(404, 'User not found');
      next(error);
    }
  } catch (err) {
    const error = createError(500, 'Unknown Error');
    next(error);
  }
};

/*
  @api:       GET /api/users/allUsers/
  @desc:      get all user's profile 
  @access:    private
*/
const getAllUserProfile = async (req, res, next) => {
  try {
    const users = await User.aggregate([
      {
        $project: {
          shopName: 1,
          email: 1,
          exchangedCount: 1,
          posts: 1,
          orders: 1,
          savedItems: 1,
          createdAt: 1,
          image: 1,
          postsCount: { $size: '$posts' },
        },
      },
    ])
      .sort({ postsCount: 'desc', createdAt: 'desc' })
      .limit(50);
    if (users) {
      res.status(200).json({ users });
    } else {
      const error = createError(404, 'User not found');
      next(error);
    }
  } catch (err) {
    const error = createError(500, 'Unknown Error');
    next(error);
  }
};

/*
  @api:       PATCH /api/users/profile/:id
  @desc:      update user profile
  @access:    private
*/
const updateUserProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json(errors);
    }

    const userId = req.params.id;
    const {
      shopName,
      phoneNo,
      firstName,
      lastName,
      division,
      district,
      area,
      currentInstitution,
    } = req.body;

    let imageData;

    if (req.file) {
      const imageUploadResult = await fileUploadToAwsS3(req.file);

      if (!imageUploadResult) {
        const error = createError(400, 'Image upload failed');
        next(error);
      }

      imageData = imageUploadResult.Key;
    } else if (req.body.image !== 'null') {
      imageData = req.body.image;
    } else if (req.body.image === 'null') {
      imageData = null;
    }

    if (userId === req.user.id) {
      const userUpdate = await User.findByIdAndUpdate(
        userId,
        {
          shopName,
          phoneNo,
          firstName,
          lastName,
          image: imageData,
          division,
          district,
          area,
          currentInstitution,
        },
        { new: true }
      ).select('-password -__v');

      res
        .status(201)
        .json({ message: 'User update successful', userUpdate: userUpdate });
    } else {
      const error = createError(400, 'User update failed');
      next(error);
    }
  } catch (err) {
    const error = createError(400, 'User update failed');
    next(error);
  }
};

/*
  @api:       POST /api/users/changePassword/
  @desc:      change Password
  @access:    private
*/
const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (user) {
      result = await bcrypt.compare(oldPassword, user.password);
      if (result) {
        await User.findByIdAndUpdate(req.user.id, {
          password: encriptPassword(newPassword),
        });

        res.status(201).json({
          message: 'Password changed successful.',
        });
      } else {
        const error = createError(401, 'Old Password does not match.');
        next(error);
      }
    } else {
      const error = createError(404, 'User not found');
      next(error);
    }
  } catch (err) {
    const error = createError(500, 'Password change failed.');
    next(error);
  }
};

/*
  @api:       POST /api/users/resetPasswordLink/
  @desc:      Reset Password
  @access:    public
*/
const resetPasswordLink = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (user) {
      const resetToken = uuidv4();

      await User.findOneAndUpdate(user._id, {
        resetToken,
        resetTokenExpiry: new Date(new Date().getTime() + 15 * 60000),
      });

      const verificationLink = `${process.env.FRONT_END_URL_PROD}/managePassword/setNew?user=${user._id}&resetToken=${resetToken}`;

      const mailBody = `<html><body><h2>Reset your password </h2><p>Click on the below link to reset your password</p><p><a href=${verificationLink} target="_blank">Reset Password</a></p></body></html>`;

      const mailSendResponse = await sendMailToUser(
        user.email,
        mailBody,
        'BoiExchange - Reset Password'
      );

      if (mailSendResponse.messageId) {
        res.status(200).json({
          message: 'Password reset link sent successfully',
          mailTo: user.email,
        });
      } else {
        const error = createError(500, 'Password reset link sent failed.');
        next(error);
      }
    } else {
      const error = createError(500, 'User not found with this email');
      next(error);
    }
  } catch (err) {
    const error = createError(500, 'Password reset link sent failed.');
    next(error);
  }
};

/*
  @api:       POST /api/users/setNewPassword/
  @desc:      Set new Password
  @access:    public
*/
const setNewPassword = async (req, res, next) => {
  try {
    const { newPassword, userId, resetToken } = req.body;
    const user = await User.findById(userId);

    if (user) {
      if (
        user.resetToken === resetToken &&
        user.resetTokenExpiry > new Date()
      ) {
        await user.update({
          password: encriptPassword(newPassword),
          resetToken: null,
          resetTokenExpiry: null,
        });

        res.status(201).json({
          message: 'Password changed successfully',
        });
      } else {
        const error = createError(
          401,
          'Your password reset link is invalid or got expired.'
        );
        next(error);
      }
    } else {
      const error = createError(500, 'User not found.');
      next(error);
    }
  } catch (err) {
    const error = createError(500, 'Password change failed.');
    next(error);
  }
};

// Helper Functions //

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {});
};

const encriptPassword = (password) => {
  const saltRounds = 10;
  return bcrypt.hashSync(password, saltRounds);
};

// Exports //

module.exports = {
  login,
  register,
  getUserProfileById,
  getAllUserProfile,
  updateUserProfile,
  changePassword,
  resetPasswordLink,
  setNewPassword,
};
