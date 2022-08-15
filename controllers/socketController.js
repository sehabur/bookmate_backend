const createError = require('http-errors');
const Conversation = require('../models/conversationModel');
const Message = require('../models/messageModel');
const User = require('../models/userModel');

const logger = require('heroku-logger');
const winston = require('winston');

// Helper Functions //

const getReceiver = (users, receiverId) => {
  return users.find((user) => user.userId === receiverId);
};

const getConversationsByUser = async (userId) => {
  try {
    const conversationLists = await Conversation.find({
      participants: userId,
    })
      .sort({
        lastActivity: 'desc',
      })
      .populate('participants');

    return conversationLists;
  } catch (err) {
    const error = createError(500, err.message);
    console.log(error);
  }
};

const addSocketUser = (users, userId, socketId) => {
  let userExist = false;

  users.forEach((user, index) => {
    if (user.userId === userId) {
      users[index].socketId = socketId;
      userExist = true;
    }
  });
  if (!userExist) {
    users.push({ userId, socketId });
  }
  console.log(`${userId} user added`);

  return users;
};

const sendMessageSocket = async (users, io, message, callback) => {
  const { chatId, sender, receiver, text } = message;

  logger.info('users', { users });

  winston.log('info', '-------Hello log files!------------', {
    users,
  });

  const receiverUser = getReceiver(users, receiver);
  const senderUser = getReceiver(users, sender);

  try {
    receiverUser && io.to(receiverUser.socketId).emit('getMessage', message);

    const newMessage = new Message(message);
    await newMessage.save();

    await Conversation.findOneAndUpdate(
      { chatId },
      { lastActivity: new Date(), lastText: text, new: true }
    );

    callback({
      status: 'ok',
    });

    const senderConversationLists = await getConversationsByUser(sender);
    io.to(senderUser.socketId).emit(
      'updateConversationList',
      senderConversationLists
    );
    const receiverConversationLists = await getConversationsByUser(receiver);
    io.to(receiverUser.socketId).emit(
      'updateConversationList',
      receiverConversationLists
    );
  } catch (err) {
    const error = createError(500, err.message);
    console.log(error);
  }
};

const resetNewConversation = async (conversationId) => {
  try {
    await Conversation.findByIdAndUpdate(conversationId, { new: false });
  } catch (error) {
    console.log(error);
  }
};

const removeSocketUser = (users, socketId) =>
  users.filter((user) => user.socketId !== socketId);

module.exports = {
  addSocketUser,
  sendMessageSocket,
  resetNewConversation,
  removeSocketUser,
};
