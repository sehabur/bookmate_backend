const createError = require('http-errors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const User = require('../models/userModel');

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
      if (user.isVerified) {
        bcrypt.compare(password, user.password, (err, result) => {
          if (err) {
            const error = createError(401, 'Login Failed');
            next(error);
          } else {
            if (result) {
              res.status(200).json({
                message: 'Login successful',
                user: {
                  id: user.id,
                  email,
                  token: generateToken(user.id),
                },
              });
            } else {
              const error = createError(401, 'Password does not match');
              next(error);
            }
          }
        });
      } else {
        const error = createError(401, 'Email is not verified');
        next(error);
      }
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

    const { firstName, lastName, email, password } = req.body;
    const userExists = await User.findOne({ email });

    if (!userExists) {
      const newUser = await User.create({
        firstName,
        lastName,
        email,
        password: encriptPassword(password),
      });

      res.status(201).json({
        message: 'User creation successful',
        user: {
          firstName,
          lastName,
          email,
        },
      });
    } else {
      const error = createError(400, 'User already exists');
      next(error);
    }
  } catch (err) {
    const error = createError(400, 'User creation failed');
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
    const user = await User.findOne({ id: userId }).select('-password -__v');

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
  @api:       PUT /api/users/profile/:id
  @desc:      update user profile of a specific user
  @access:    private
*/
const updateUserProfile = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { firstName, lastName, image, division, district, area } = req.body;

    if (userId === req.user.id) {
      const userUpdate = await User.findOneAndUpdate(
        { id: userId },
        { firstName, lastName, image, division, district, area },
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
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
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
  updateUserProfile,
};
