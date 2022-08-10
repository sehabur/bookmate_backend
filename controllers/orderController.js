const { v4: uuidv4 } = require('uuid');
const createError = require('http-errors');
const Conversation = require('../models/conversationModel');
const Message = require('../models/messageModel');
const Notification = require('../models/notificationModel');
const Order = require('../models/orderModel');
const Post = require('../models/postModel');
const User = require('../models/userModel');

/*
  @api:       GET /api/orders/:id
  @desc:      get a order by its Id
  @access:    private
*/
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      // .populate('requestor', '-password -__v')
      // .populate('requestedTo', '-password -__v')
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
    const orders = await Order.find()
      .or([{ requestor: req.params.id }, { requestedTo: req.params.id }])
      .populate('orderItem', 'title writer category image1 district area')
      .populate('requestedTo', 'email shopName')
      .sort({ createdAt: 'desc' })
      .exec();

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
  @api:       GET /api/orders/isOrderPlaced/:id
  @desc:      get if a order is placed
  @access:    private
*/
const getIsOrderPlaced = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      orderItem: req.params.id,
      requestor: req.user.id,
      requestStatus: { $ne: 'rejected' },
    });

    if (order) {
      res.status(200).json({ order });
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
  @api:       POST /api/orders/request
  @desc:      submit order
  @access:    private
*/
const requestOrder = async (req, res, next) => {
  try {
    const { requestedTo, orderItem, offerType, price, bookTitle, requestTime } =
      req.body;

    const order = new Order({
      requestor: req.user.id,
      requestedTo,
      orderItem,
      price,
      requestTime,
      requestStatus: 'pending',
      offerType,
    });
    const createdOrder = await order.save();

    // Create notification //
    const notification = new Notification({
      type: 'reqSent',
      text: `${req.user.shopName} has sent you a ${
        offerType === 'buy' ? 'purchase' : offerType
      } request for ${bookTitle}`,
      receiver: requestedTo,
      sender: req.user.id,
      order: createdOrder._id,
      post: orderItem,
      bookTitle,
    });
    await notification.save();

    res
      .status(201)
      .json({ message: 'Order created successfully', createdOrder });
  } catch (err) {
    const error = createError(400, err.message);
    next(error);
  }
};

/*
  @api:       PATCH /api/orders/accept/:id
  @desc:      submit order
  @access:    private
*/
const acceptOrder = async (req, res, next) => {
  // try {
  const { acceptTime, requestStatus, postId, bookTitle } = req.body;

  const updatedOrder = await Order.findByIdAndUpdate(
    req.params.id,
    {
      acceptTime,
      requestStatus,
    },
    {
      new: true,
    }
  );

  await Notification.findOneAndUpdate(
    { type: 'reqSent', order: req.params.id },
    { isActive: false }
  );

  console.log(requestStatus);

  if (requestStatus === 'accepted') {
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { exchangedCount: 1 },
    });

    await Post.findByIdAndUpdate(postId, {
      isExchanged: true,
      isActive: false,
    });

    console.log(updatedOrder);

    // Create a new conversation //
    const newConversation = new Conversation({
      chatId: uuidv4(),
      participants: [updatedOrder.requestedTo, updatedOrder.requestor],
      lastActivity: new Date(),
    });
    console.log(newConversation);
    await newConversation.save();
  }

  // Create notification //
  const notification = new Notification({
    type: 'reqAck',
    text: `${req.user.shopName} has ${requestStatus} your ${
      updatedOrder.offerType === 'buy' ? 'purchase' : updatedOrder.offerType
    } request for ${bookTitle}. Go to message section to chat with ${
      req.user.shopName
    }`,
    receiver: updatedOrder.requestor,
    sender: updatedOrder.requestedTo,
    order: updatedOrder._id,
    post: updatedOrder.orderItem,
    bookTitle,
  });
  await notification.save();

  res.status(201).json({ message: 'Order accepted successfully' });
  // } catch (err) {
  //   const error = createError(400, err.message);
  //   next(error);
  // }
};

/*
  @api:       GET /api/orders/notification/user/:id
  @desc:      get notification to be received by a user
  @access:    private
*/
const getNotificationsByUser = async (req, res, next) => {
  try {
    const notification = await Notification.find({
      receiver: req.params.id,
      isActive: true,
    }).sort({ createdAt: 'desc' });

    if (notification) {
      res.status(200).json({ notification });
    } else {
      const error = createError(404, 'No Notification to show');
      next(error);
    }
  } catch (err) {
    const error = createError(500, 'Error Occured');
    next(error);
  }
};

/*
  @api:       POST /api/orders/sendMessage
  @desc:      Send message to a participants
  @access:    private
*/
const sendMessage = async (req, res, next) => {
  const { chatId, sender, receiver, text } = req.body;

  try {
    const newMessage = new Message({
      chatId,
      sender,
      receiver,
      text,
    });
    await newMessage.save();

    await Conversation.findOneAndUpdate(
      { chatId },
      { lastActivity: new Date(), lastText: text }
    );

    res.status(201).json({ message: 'New message created successfully' });
  } catch (err) {
    const error = createError(500, err.message);
    next(error);
  }
};

/*
  @api:       GET /api/orders/newMessageCount/user/:id
  @desc:      get new message count of a user
  @access:    private
*/
const getNewMessageCount = async (req, res, next) => {
  const userId = req.params.id;

  try {
    const newMessageCount = await Conversation.find({
      participants: userId,
      new: true,
    }).count();

    res.status(200).json({ count: newMessageCount || 0 });
  } catch (err) {
    const error = createError(500, 'Error Occured');
    next(error);
  }
};

/*
  @api:       GET /api/orders/getConversationsByUser/:userId
  @desc:      get Conversations By a User
  @access:    private
*/
const getConversationsByUser = async (req, res, next) => {
  const userId = req.params.userId;

  try {
    const conversationLists = await Conversation.find({
      participants: userId,
    })
      .sort({
        lastActivity: 'desc',
      })
      .populate('participants');

    res.status(200).json({ conversationLists });
  } catch (err) {
    const error = createError(500, err.message);
    next(error);
  }
};

/*
  @api:       GET /api/orders/getMessagesByChatId/:chatId
  @desc:      ge tMessages By ChatId
  @access:    private
*/
const getMessagesByChatId = async (req, res, next) => {
  const chatId = req.params.chatId;

  try {
    const messages = await Message.find({
      chatId,
    })
      .sort({
        createdAt: 'desc',
      })
      .limit(50);

    res.status(200).json({ messages });
  } catch (err) {
    const error = createError(500, err.message);
    next(error);
  }
};

/*
  @api:       PATCH /api/orders/notification/:id
  @desc:      Make a notification mark as read
  @access:    private
*/
const notificationResponded = async (req, res, next) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, {
      isActive: false,
    });
    res.status(201).json({ message: 'Notificated responded successfully' });
  } catch (err) {
    const error = createError(500, 'Error occured');
    next(error);
  }
}; // Not is use right now//

module.exports = {
  getOrderById,
  getOrdersByUser,
  getIsOrderPlaced,
  requestOrder,
  acceptOrder,
  getNotificationsByUser,
  getNewMessageCount,
  sendMessage,
  getConversationsByUser,
  getMessagesByChatId,
};
