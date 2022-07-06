var express = require('express');
var path = require('path');
const dotenv = require('dotenv');

const postRoute = require('./routes/postRoute');
const userRoute = require('./routes/userRoute');
const orderRoute = require('./routes/orderRoute');
const {
  NotFoundHanlder,
  ErrorHanlder,
} = require('./middlewares/errorHandlingMiddleware');

var app = express();
dotenv.config();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

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

// catch 404 and forward to NotFoundHanlder //
app.use(NotFoundHanlder);

// error handler
app.use(ErrorHanlder);

module.exports = app;
