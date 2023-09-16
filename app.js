var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var hbs = require('express-handlebars')
var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');
var db = require('./config/connection')
var app = express();
const dotenv=require('dotenv')
var twilio = require('twilio')
// var fileUpload = require('express-fileupload')
dotenv.config()
var session = require('express-session')
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs', hbs.engine({
  extname: 'hbs', defaultLayout: 'layout', layoutsDir: __dirname + '/views/layout/',
  partialsDir: __dirname + '/views/partials/', adminDir: __dirname + '/views/admin/',
  helpers: {
    json: function (context) {
      return JSON.stringify(context)
    },
    inc1: function (context) {
      return context + 1
    },
    productTotal: function (quantity, price) {
      return quantity * price
    }
  }
}));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// app.use(fileUpload())
app.use(session({ secret: "key", resave: false, saveUninitialized: true, cookie: { maxAge: 1200000 } }));
db.connect((err) => {
  if (err) console.log("Connection error" + err);
  else console.log("Database connected");
});
app.use('/', userRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  let admin = req.session.adminLoggedIn
  res.render('error', { admin, layout: 'loginlayout' });

});

module.exports = app;
