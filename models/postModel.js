const mongoose = require('mongoose');

const postSchema = mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
    },
    writer: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    price: {
      type: Number,
      default: 0,
    },
    image1: {
      type: String,
      required: true,
    },
    image2: {
      type: String,
    },
    image3: {
      type: String,
    },
    division: {
      type: String,
      required: true,
    },
    district: {
      type: String,
      required: true,
    },
    area: {
      type: String,
      required: true,
    },
    lat: {
      type: Number,
    },
    long: {
      type: Number,
    },
    enableSellOffer: {
      type: Boolean,
      default: true,
    },
    enableExchangeOffer: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isExchanged: {
      type: Boolean,
      default: false,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
