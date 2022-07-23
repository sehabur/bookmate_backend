const mongoose = require('mongoose');

const conversationSchema = mongoose.Schema(
  {
    chatId: {
      type: String,
      required: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
      },
    ],
    lastActivity: {
      type: Date,
      required: true,
    },
    lastText: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
