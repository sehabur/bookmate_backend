const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['reqSent', 'reqAck', 'info'],
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    bookTitle: {
      type: String,
      required: true,
    },
    ctaButtonText: {
      type: String,
    },
    ctaButtonAction: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
