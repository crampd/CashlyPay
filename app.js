/*
Copyright 2020 Square Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

const express = require('express');
require('dotenv').config();
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const routes = require('./routes/index');
const apiRoutes = require('./routes/api');
const config = require('./config/config');
const app = express();

// Node creates cashed instance of square-client, on initial load
require('./util/square-client');

const rawBodySaver = (req, res, buf) => {
  if (buf?.length) {
    req.rawBody = buf.toString('utf8');
  }
};

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.set('view options', {
  basedir: path.join(__dirname),
});

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
app.use(logger('dev'));
app.use(
  cors({
    origin: config.server.corsOrigin,
    credentials: true,
  })
);

if (config.features.enableHelmet) {
  app.use(helmet());
}

if (config.features.enableCompression) {
  app.use(compression());
}

if (config.features.enableRateLimit) {
  app.use(
    rateLimit({
      windowMs: config.security.rateLimitWindow,
      max: config.security.rateLimitMax,
    })
  );
}

app.use(
  bodyParser.json({
    limit: '1mb',
    verify: rawBodySaver,
  })
);
app.use(
  bodyParser.urlencoded({
    extended: false,
    verify: rawBodySaver,
  })
);
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '.well-known')));

app.use('/api', apiRoutes);
app.use('/', routes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers
// For simplicity, we print all error information
app.use(function (err, req, res, next) {
  const status = err.status || 500;

  if (req.path.startsWith('/api/')) {
    return res.status(status).json({
      message: err.message,
      errors: err.errors,
    });
  }

  res.status(status);
  res.render('error', {
    status: err.status,
    message: err.message,
    // If it is a response error then format the JSON string, if not output the error
    error: err.errors ? JSON.stringify(err.errors, null, 4) : err.stack,
  });
});

module.exports = app;
