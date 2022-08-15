// External imports //
const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const winston = require('winston');

// Internal imports //
const postRoute = require('./routes/postRoute');
const userRoute = require('./routes/userRoute');
const orderRoute = require('./routes/orderRoute');
const {
  NotFoundHanlder,
  ErrorHanlder,
} = require('./middlewares/errorHandlingMiddleware');
const { getImageFromAwsS3 } = require('./middlewares/fileUpload');
const { initSocketIo, getSocketIo } = require('./socket');
const {
  updateUserSocketId,
  sendMessageSocket,
  resetNewConversation,
  addSocketUser,
  removeSocketUser,
} = require('./controllers/socketController');

var app = express();
dotenv.config();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // For devlopment purpose //
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PATCH, PUT, DELETE, OPTIONS'
  );
  next();
});

// Routes //
app.use('/api/posts/', postRoute);
app.use('/api/users/', userRoute);
app.use('/api/orders/', orderRoute);

app.get('/api/image/:image', getImageFromAwsS3);

// Catch 404 and forward to NotFoundHanlder //
app.use(NotFoundHanlder);

// Error handler
app.use(ErrorHanlder);

/**
 * Create HTTP server.
 */
var server = http.createServer(app);

// Initiate Socket.io //
initSocketIo(server);
const io = getSocketIo();
let users = [];

// Socket.io functions //
io.on('connection', (socket) => {
  winston.log('info', 'A user conntected');

  socket.on('addUser', (userId) => {
    users = addSocketUser(users, userId, socket.id);
    console.log(users);
  });
  socket.on('sendMessage', (data, callback) => {
    sendMessageSocket(users, io, data, callback);
    console.log(users);
  });
  socket.on('resetNewConversation', (conversationId) => {
    resetNewConversation(conversationId);
  });
  socket.on('disconnect', () => {
    users = removeSocketUser(users, socket.id);
    winston.log('info', 'A user disconntected');
    console.log(users);
  });
});

// Database connection //
mongoose
  .connect(process.env.MONGO_CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Database connection successful!'))
  .catch((err) => console.log(err));

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});

module.exports = app;
