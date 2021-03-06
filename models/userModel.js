const mongoose = require('mongoose');

const userSchema = mongoose.Schema(
  {
    shopName: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
    division: {
      type: String,
    },
    district: {
      type: String,
    },
    area: {
      type: String,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    exchangedCount: {
      type: Number,
      default: 0,
    },
    posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Post',
      },
    ],
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Order',
      },
    ],
    savedItems: [
      {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Post',
      },
    ],
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);

module.exports = User;
