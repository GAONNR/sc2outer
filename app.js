var createError = require('http-errors');
var express = require('express');
var expressLess = require('express-less');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var userRouter = require('./routes/user');
var apiRouter = require('./routes/api');

var session = require('express-session');

var passport = require('passport');
var BnetStrategy = require('passport-bnet').Strategy;

var BNET_ID = require('./secrets').BNET_ID;
var BNET_SECRET = require('./secrets').BNET_SECRET;

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

// Use the BnetStrategy within Passport.
passport.use(
  new BnetStrategy(
    {
      clientID: BNET_ID,
      clientSecret: BNET_SECRET,
      scope: 'sc2.profile',
      callbackURL: '/auth/bnet/callback'
    },
    function(accessToken, refreshToken, profile, done) {
      process.nextTick(function() {
        return done(null, profile);
      });
    }
  )
);

var app = express();
app.use('/stylesheets', expressLess(__dirname + '/public/stylesheets'));
app.use(session({ secret: 'blizzard', saveUninitialized: true, resave: true }));

// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/user', userRouter);
app.use(
  '/api',
  function(req, res, next) {
    req.BNET = {
      ID: BNET_ID,
      SECRET: BNET_SECRET
    };
    next();
  },
  apiRouter
);

app.get('/auth/bnet', passport.authenticate('bnet'));

app.get(
  '/auth/bnet/callback',
  passport.authenticate('bnet', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/');
  }
);

app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
