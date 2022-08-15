let socketIo;

const initSocketIo = (server) => {
  socketIo = require('socket.io')(server, {
    cors: {
      origin: process.env.SOCKET_ORIGIN,
      methods: ['GET', 'POST', 'OPTIONS'],
    },
  });
  return socketIo;
};

const getSocketIo = () => {
  if (!socketIo) {
    throw new Error('Socket.io not initialized.');
  }
  return socketIo;
};

module.exports = {
  initSocketIo,
  getSocketIo,
};
