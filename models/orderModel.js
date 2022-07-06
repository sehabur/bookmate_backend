const mongoose = require('mongoose');

const orderSchema = mongoose.Schema(
  {
    requestor: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    requestedTo: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    orderItem: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Post',
    },
    offerType: {
      type: String,
      enum: ['exchange', 'buy'],
      required: true,
    },
    price: {
      type: Number,
      default: 0.0,
    },
    requestTime: {
      type: Date,
      required: true,
    },
    acceptTime: {
      type: Date,
    },
    requestStatus: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
