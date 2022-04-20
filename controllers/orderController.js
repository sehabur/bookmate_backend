const createError = require('http-errors');

const Order = require('../models/orderModel');

/*
  @api:       GET /api/orders/:id
  @desc:      get a order by its Id
  @access:    private
*/
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', '-password -__v')
      .populate('orderItems.product')
      .exec();

    if (order) {
      if (order.user._id === req.user._id) {
        res.status(200).json({ order });
      } else {
        const error = createError(401, 'Unauthorized to get this order');
        next(error);
      }
    } else {
      const error = createError(404, 'No Order Found with the Id Provided');
      next(error);
    }
  } catch (err) {
    const error = createError(500, 'No Products Found');
    next(error);
  }
};

/*
  @api:       GET /api/orders/user/:id
  @desc:      get orders of a user
  @access:    private
*/
const getOrdersByUser = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.params.id });

    if (orders) {
      if (req.params.id === req.user._id.toString()) {
        res.status(200).json({ orders });
      } else {
        const error = createError(401, 'Unauthorized to get this order');
        next(error);
      }
    } else {
      const error = createError(
        404,
        'No Order Found with the user Id Provided'
      );
      next(error);
    }
  } catch (err) {
    const error = createError(500, 'No Products Found');
    next(error);
  }
};

/*
  @api:       POST /api/orders/
  @desc:      submit order
  @access:    private
*/
const submitOrder = async (req, res, next) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      shippingCost,
      totalProductPrice,
      totalAmount,
    } = req.body;

    if (orderItems && orderItems.length < 1) {
      const error = createError(400, 'No order found');
      next(error);
    } else {
      const order = new Order({
        orderItems,
        shippingAddress,
        paymentMethod,
        shippingCost,
        totalProductPrice,
        totalAmount,
        user: req.user.id,
      });
      const createdOrder = await order.save();

      res
        .status(201)
        .json({ message: 'Order created successfully', createdOrder });
    }
  } catch (err) {
    const error = createError(400, err.message);
    next(error);
  }
};

module.exports = {
  getOrderById,
  getOrdersByUser,
  submitOrder,
};
