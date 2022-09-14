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
    const error = createError(500, 'Login failed. Unknou99999wn Error');
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

    const { shopName, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (!userExists) {
      const newUser = await User.create({
        shopName,
        email,
        password: encriptPassword(password),
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
      .limit(70);
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
  console.log(req.body);
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json(errors);
    }

    const userId = req.params.id;
    const { shopName, phoneNo, firstName, lastName, division, district, area } =
      req.body;

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

    // res.send(req);

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
};
