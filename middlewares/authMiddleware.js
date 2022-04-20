const jwt = require('jsonwebtoken');

const createError = require('http-errors');

const User = require('../models/userModel');

const checkLogin = async (req, res, next) => {
  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded) {
        const user = await User.findById(decoded.id).select('-password -__v');
        if (user) {
          req.user = user;
          next();
        } else {
          const error = createError(401, 'Invalid Token');
          next(error);
        }
      }
    } else {
      const error = createError(401, 'Invalid Token');
      next(error);
    }
  } catch (err) {
    const error = createError(401, err.message);
    next(error);
  }
};

const checkAuthorization = async (req, res, next) => {
  try {
    // later //
  } catch (err) {
    const error = createError(401, err.message);
    next(error);
  }
};

module.exports = {
  checkLogin,
  checkAuthorization,
};
