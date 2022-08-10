const express = require('express');

const router = express.Router();

const {
  requestOrder,
  acceptOrder,
  getOrderById,
  getOrdersByUser,
  getIsOrderPlaced,
  getNotificationsByUser,
  getNewMessageCount,
  sendMessage,
  getConversationsByUser,
  getMessagesByChatId,
} = require('../controllers/orderController');

const { checkLogin } = require('../middlewares/authMiddleware');

router.route('/request').post(checkLogin, requestOrder);

router.route('/sendMessage').post(checkLogin, sendMessage);

router
  .route('/getConversationsByUser/:userId')
  .get(checkLogin, getConversationsByUser);

router
  .route('/getMessagesByChatId/:chatId')
  .get(checkLogin, getMessagesByChatId);

router.route('/accept/:id').patch(checkLogin, acceptOrder);

router.route('/user/:id').get(checkLogin, getOrdersByUser);

router.route('/isOrderPlaced/:id').get(checkLogin, getIsOrderPlaced);

router.route('/notification/user/:id').get(checkLogin, getNotificationsByUser);

router.route('/newMessageCount/user/:id').get(checkLogin, getNewMessageCount);

router.route('/:id').get(checkLogin, getOrderById);

module.exports = router;
