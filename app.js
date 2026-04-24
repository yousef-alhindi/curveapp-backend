// // app.js
// import express from 'express';
// import morgan from 'morgan';
// import cookieParser from 'cookie-parser';
// import bodyParser from 'body-parser';
// import path from 'path';
// import cors from 'cors';
// import dotenv from 'dotenv';
// // import helmet from 'helmet';
// import compression from 'compression';
// import rateLimit from 'express-rate-limit';
// import figlet from 'figlet';
// // import boxen from 'boxen';
// import chalk from 'chalk';
// import pino from 'pino';
// import pinoHttp from 'pino-http';

// import indexRouter from './app/routes/index.js';
// import corn from './app/utils/corn-job.js';
// import errorHandler from './app/middlewares/validationErrorHandler.js';
// import { ready as dbReady } from './app/config/db.js';

// dotenv.config();

// // ---- Pretty startup banner (prints immediately) ----
// const banner = figlet.textSync('CURVE', { horizontalLayout: 'full' });
// console.log(chalk.cyan(banner));
// // console.log(
// //   boxen(
// //     `${chalk.bold('Environment')}: ${process.env.NODE_ENV || 'development'}  ${chalk.bold('PORT')}: ${process.env.PORT || 3000}\n` +
// //     `${chalk.bold('Database')}: ${process.env.DB_NAME || 'N/A'} @ ${process.env.DB_HOST || process.env.DB_SERVER || '127.0.0.1'}:${process.env.DB_PORT || '27017'}\n` +
// //     `${chalk.bold('User (masked)')}: ${((process.env.DB_USERNAME||'').slice(0,3) + '***')}\n\n` +
// //     `${chalk.gray('Tip')}: Use /health for a quick status and /metrics for runtime stats (dev only).`,
// //     { padding: 1, margin: 1, borderColor: 'green', borderStyle: 'round' }
// //   )
// // );

// // logger
// const pretty = pino({ level: process.env.LOG_LEVEL || 'info' });
// const httpLogger = pinoHttp({ logger: pretty });

// const app = express();

// // security & perf
// // app.use(helmet());
// app.use(compression());
// app.use(httpLogger);
// app.use(morgan('dev'));
// app.use(bodyParser.json({ limit: '2mb' }));
// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(cookieParser());

// // CORS (safe list)
// const allowedOrigins = [
//   'http://localhost:4200',
//   'https://www.curveapp.co'
// ];
// app.use(cors({
//   origin: (origin, cb) => {
//     if (!origin) return cb(null, true);
//     if (allowedOrigins.indexOf(origin) !== -1) return cb(null, true);
//     return cb(new Error('CORS policy: Origin not allowed'), false);
//   },
//   methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
//   credentials: true,
//   optionsSuccessStatus: 204
// }));

// // Rate limiter
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 300,
//   standardHeaders: true,
//   legacyHeaders: false,
// });
// app.use(limiter);

// // static & SPA fallbacks
// const __dirname = path.resolve();
// app.use(express.static(path.join(__dirname, './app/public')));
// app.use('/user-panel', express.static(path.join(__dirname, 'dist/user-panel')));
// app.get('/user-panel/*', (req, res) => res.sendFile(path.join(__dirname, 'dist/user-panel', 'index.html')));
// app.use('/admin-panel', express.static(path.join(__dirname, 'dist/admin-panel')));
// app.get('/admin-panel/*', (req, res) => res.sendFile(path.join(__dirname, 'dist/admin-panel', 'index.html')));
// app.use('/restaurant-panel', express.static(path.join(__dirname, 'dist/restaurant-panel')));
// app.get('/restaurant-panel/*', (req, res) => res.sendFile(path.join(__dirname, 'dist/restaurant-panel', 'index.html')));

// app.use('/supplement-panel', express.static(path.join(__dirname, 'dist/supplement-panel')));
// app.get('/supplement-panel/*', (req, res) => {
//    res.sendFile(path.join(__dirname, 'dist/supplement-panel', 'index.html'));
// });

// app.use('/gym-panel', express.static(path.join(__dirname, 'dist/gym-panel')));
// app.get('/gym-panel/*', (req, res) => {
//    res.sendFile(path.join(__dirname, 'dist/gym-panel', 'index.html'));
// });
// app.use('/grocery-panel', express.static(path.join(__dirname, 'dist/grocery-panel')));
// app.get('/grocery-panel/*', (req, res) => {
//    res.sendFile(path.join(__dirname, 'dist/grocery-panel', 'index.html'));
// });

// // Route
// app.use('/api/v1', indexRouter);

// // health & metrics
// // app.get('/health', async (req, res) => {
// //   // Ensure DB status included if possible
// //   const up = { status: 'ok', uptime: process.uptime(), timestamp: Date.now() };
// //   res.setHeader('Cache-Control', 'no-store');
// //   return res.status(200).json(up);
// // });

// // if (process.env.NODE_ENV !== 'production') {
// //   app.get('/metrics', (req, res) => {
// //     const m = {
// //       memory: process.memoryUsage(),
// //       env: process.env.NODE_ENV,
// //       pid: process.pid,
// //       uptime: process.uptime()
// //     };
// //     res.json(m);
// //   });
// // }

// // error handler (your middleware)
// app.use(errorHandler.handleError());

// // 404 JSON
// app.use((req, res) => {
//   res.status(404).json({ error: 'Not Found', path: req.originalUrl });
// });
// corn.reminder.start();
// corn.cronToUpdateAdminAndRestaurantPackagesDeliveryStatus.start();

// // Graceful shutdown helper
// const gracefulShutdown = async (server) => {
//   pretty.info('Shutting down gracefully… ✨');
//   try {
//     server.close(() => {
//       pretty.info('HTTP server closed.');
//     });
//     // close mongoose connection if present
//     try {
//       const mongoose = (await import('mongoose')).default;
//       await mongoose.connection.close(false);
//       pretty.info('Mongoose connection closed.');
//     } catch (e) {
//       pretty.warn('Mongoose close failed or not present:', e.message || e);
//     }
//   } catch (err) {
//     pretty.error('Error during shutdown', err);
//   } finally {
//     process.exit(0);
//   }
// };

// // function to start server once DB is ready
// const startServer = (port = Number(process.env.PORT || 3000)) => {
//   const server = app.listen(port, () => {
//     pretty.info(`Server listening on port ${port} 🚀`);
//   });
//   process.on('SIGINT', () => gracefulShutdown(server));
//   process.on('SIGTERM', () => gracefulShutdown(server));
//   return server;
// };

// // Wait for DB before starting server (fail-fast)
// (async () => {
//   try {
//     console.log(chalk.yellow('Waiting for MongoDB connection...'));
//     await dbReady;
//     console.log(chalk.green('MongoDB connected — starting server.'));
//     // Start cron after DB ready (if available)
//     if (corn?.reminder?.start) {
//       try {
//         corn.reminder.start();
//         pretty.info('Cron reminder started ✅');
//       } catch (e) {
//         pretty.error('Cron job failed to start', e);
//       }
//     }
//     startServer();
//   } catch (err) {
//     console.error(chalk.red('Failed to connect to MongoDB. Server will not start.'));
//     console.error(err);
//     process.exit(1);
//   }
// })();

// export default app;


import express from 'express';
import logger from 'morgan';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import indexRouter from './app/routes/index';
import corn from './app/utils/corn-job';
import errorHandler from './app/middlewares/validationErrorHandler';

var app = express();
require('./app/config/db');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(logger('dev'));
app.use(express.json());
app.use(cors());

app.use(
   cors({
      origin: ['http://localhost:4200, https://www.curveapp.co'],
      methods: 'GET,PUT,POST,PATCH, DELETE',
      preflightContinue: false,
      optionsSuccessStatus: 204,
      credentials: true,
   })
);
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
dotenv.config();

app.use(express.static(path.join(__dirname, './app/public')));

// ------- FOR UPLOADING DIST ------

app.use('/user-panel', express.static(path.join(__dirname, 'dist/user-panel')));
app.get('/user-panel/*', (req, res) => {
   res.sendFile(path.join(__dirname, 'dist/user-panel', 'index.html'));
});

app.use('/admin-panel', express.static(path.join(__dirname, 'dist/admin-panel')));
app.get('/admin-panel/*', (req, res) => {
   res.sendFile(path.join(__dirname, 'dist/admin-panel', 'index.html'));
});

app.use('/restaurant-panel', express.static(path.join(__dirname, 'dist/restaurant-panel')));
app.get('/restaurant-panel/*', (req, res) => {
   res.sendFile(path.join(__dirname, 'dist/restaurant-panel', 'index.html'));
});

app.use('/supplement-panel', express.static(path.join(__dirname, 'dist/supplement-panel')));
app.get('/supplement-panel/*', (req, res) => {
   res.sendFile(path.join(__dirname, 'dist/supplement-panel', 'index.html'));
});

app.use('/gym-panel', express.static(path.join(__dirname, 'dist/gym-panel')));
app.get('/gym-panel/*', (req, res) => {
   res.sendFile(path.join(__dirname, 'dist/gym-panel', 'index.html'));
});
app.use('/grocery-panel', express.static(path.join(__dirname, 'dist/grocery-panel')));
app.get('/grocery-panel/*', (req, res) => {
   res.sendFile(path.join(__dirname, 'dist/grocery-panel', 'index.html'));
});

// Route
app.use('/api/v1', indexRouter);

//  handle Error
app.use(errorHandler.handleError());

// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));
// });

// error handler
app.use(function (err, req, res, next) {
   // set locals, only providing error in development
   res.locals.message = err.message;
   res.locals.error = req.app.get('env') === 'development' ? err : {};

   // render the error page
   res.status(err.status || 500);
   res.render('error');
});
corn.reminder.start();
corn.cronToUpdateAdminAndRestaurantPackagesDeliveryStatus.start();

process.setMaxListeners(Infinity); // enable when get warning for EventEmitter memory leak....

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running`);
});

module.exports = app;
