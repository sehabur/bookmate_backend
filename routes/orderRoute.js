const express = require('express');

const router = express.Router();

const {
  requestOrder,
  acceptOrder,
  getOrderById,
  getOrdersByUser,
  getIsOrderPlaced,
  getNotificationsByUser,
} = require('../controllers/orderController');

const { checkLogin } = require('../middlewares/authMiddleware');

router.route('/request').post(checkLogin, requestOrder);

router.route('/accept/:id').patch(checkLogin, acceptOrder);

router.route('/:id').get(checkLogin, getOrderById);

router.route('/user/:id').get(checkLogin, getOrdersByUser);

router.route('/isOrderPlaced/:id').get(checkLogin, getIsOrderPlaced);

router.route('/notification/user/:id').get(checkLogin, getNotificationsByUser);

module.exports = router;
