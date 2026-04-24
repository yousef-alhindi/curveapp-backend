// import mongoose from 'mongoose';
// import { db } from './index.js'; 
// import dotenv from 'dotenv';

// import chalk from 'chalk';
// import figlet from 'figlet';
// import boxen from 'boxen';
// import gradient from 'gradient-string';
// import ora from 'ora';
// import logUpdate from 'log-update';
// import cliProgress from 'cli-progress';

// dotenv.config();

// // ready promise for external modules to await
// let readyResolve, readyReject;
// export const ready = new Promise((resolve, reject) => {
//   readyResolve = resolve;
//   readyReject = reject;
// });

// // Helper: safely mask sensitive parts for logs
// const mask = (str, show = 2) => {
//   if (!str) return '';
//   const keep = Math.min(show, str.length);
//   return str.slice(0, keep) + '*'.repeat(Math.max(0, str.length - keep));
// };

// // Build connection string (don't print raw credentials)
// const host = db.NODE_ENV === 'LOCAL' ? db.LOCAL_IP : db.SERVER_IP;
// const db_connection = `mongodb://${db.DB_USERNAME}:${db.DB_PASSWORD}@${host}:${db.DB_PORT}/${db.DB_NAME}`;

// // Start a spinner and animated connection dashboard
// const spinner = ora({
//   text: `${chalk.yellow('Connecting to MongoDB')} 🔌 — ${chalk.dim('Establishing secure channel...')}`,
//   spinner: {
//     interval: 80,
//     frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
//   }
// });

// // compact status card to show while connecting
// const makeStatusCard = (state = 'connecting', pct = 0) => {
//   const statusEmoji = state === 'ok' ? '✅' : state === 'fail' ? '❌' : '⌛';
//   const title = (figlet.textSync('MONGO', { horizontalLayout: 'full' }) || 'MONGO').split('\n')[0];
//   const content =
//     `${chalk.bold('Status:')} ${statusEmoji}  ${chalk.bold(state.toUpperCase())}\n` +
//     `${chalk.bold('Env:')} ${chalk.cyan(db.NODE_ENV)}    ${chalk.bold('DB:')} ${chalk.magenta(db.DB_NAME)}\n` +
//     `${chalk.bold('Host:')} ${chalk.yellow(host)}:${chalk.yellow(db.DB_PORT)}\n` +
//     `${chalk.bold('User:')} ${chalk.green(mask(db.DB_USERNAME))}    ${chalk.bold('Progress:')} ${pct}%`;

//   return boxen(content, {
//     padding: 1,
//     margin: 1,
//     borderStyle: 'round',
//     borderColor: state === 'ok' ? 'green' : state === 'fail' ? 'red' : 'yellow'
//   });
// };

// // small emoji fireworks animation (runs briefly on success)
// const emojiFireworks = (durationMs = 1400) => {
//   const emotes = ['🎉','✨','🚀','🌟','🔥','🥳','💫','🍾'];
//   const start = Date.now();
//   const iv = setInterval(() => {
//     const line = Array.from({ length: 6 }).map(()=> emotes[Math.floor(Math.random()*emotes.length)]).join(' ');
//     logUpdate(gradient.pastel(line) + '\n' + makeStatusCard('ok', 100));
//     if (Date.now() - start > durationMs) {
//       clearInterval(iv);
//       logUpdate.clear();
//     }
//   }, 120);
//   return new Promise(r => setTimeout(r, durationMs + 50));
// };

// // helper to export connection once available
// let __conn = null;
// let __connErr = null;
// function exportConn(conn, err) {
//   __conn = conn;
//   __connErr = err;
// }

// // Attempt connection (runs immediately)
// (async () => {
//   spinner.start();
//   // show lightweight progress bar while connecting
//   const bar = new cliProgress.SingleBar({
//     format: `${chalk.bold('Connecting')} [{bar}] {percentage}% | ETA: {eta}s`,
//     barCompleteChar: '█',
//     barIncompleteChar: '░',
//     hideCursor: true
//   }, cliProgress.Presets.shades_classic);
//   bar.start(100, 0);

//   // simulate incremental progress while actual connect runs
//   const progressInterval = setInterval(() => {
//     bar.increment(Math.max(1, Math.floor(Math.random() * 6)));
//     if (bar.value >= 98) bar.update(98);
//   }, 180);

//   try {
//     const conn = await mongoose.connect(db_connection, {
//       family: 4,
//       connectTimeoutMS: 10000,
//       serverSelectionTimeoutMS: 8000
//     });

//     clearInterval(progressInterval);
//     bar.update(100);
//     bar.stop();
//     spinner.succeed(chalk.greenBright('Connection established ✅ — handshake complete!'));

//     // display big banner + status card
//     const banner = figlet.textSync('MongoDB', { horizontalLayout: 'default' });
//     console.log(gradient.rainbow.multiline(banner));
//     console.log(makeStatusCard('ok', 100));

//     // small celebratory emoji fireworks
//     await emojiFireworks(900).catch(()=>{});

//     // Final concise info (masked credentials)
//     console.log(chalk.gray('────────────────────────────────────────────────────────'));
//     console.log(`${chalk.bold('Host:')} ${chalk.yellow(host)}:${chalk.yellow(db.DB_PORT)}   ${chalk.bold('DB:')} ${chalk.magenta(db.DB_NAME)}`);
//     console.log(`${chalk.bold('User:')} ${chalk.green(mask(db.DB_USERNAME, 3))}   ${chalk.dim('(password masked)')}`);
//     console.log(`${chalk.bold('Time:')} ${chalk.cyan(new Date().toLocaleString())}  ${'🕒'}`);
//     console.log(chalk.gray('────────────────────────────────────────────────────────'));

//     // export connection for external use
//     exportConn(conn);

//     // resolve ready promise so other modules can await it
//     if (typeof readyResolve === 'function') readyResolve(conn);
//   } catch (err) {
//     clearInterval(progressInterval);
//     try { bar.stop(); } catch(e){}
//     spinner.fail(chalk.bgRed.white(' Connection Failed ❌ '));
//     console.error(boxen(
//       `${chalk.bold.red('Error:')} ${err.message || err}\n\n${chalk.dim('Please check your credentials, network, and allowed IPs (if using Atlas).')}`,
//       { padding: 1, borderColor: 'red' }
//     ));
//     console.log(makeStatusCard('fail', 0));

//     exportConn(null, err);
//     if (typeof readyReject === 'function') readyReject(err);
//   }
// })();

// export { mongoose, __conn as conn };


import mongoose from 'mongoose';
import { db } from './index.js';

require('dotenv').config();

// LOCAL_IP
let db_connection = `mongodb://${db.DB_USERNAME}:${db.DB_PASSWORD}@${
   db.NODE_ENV === 'LOCAL' ? db.LOCAL_IP : db.SERVER_IP
}:${db.DB_PORT}/${db.DB_NAME}`;

const conn = mongoose.connect(db_connection);
conn
   .then(() => {
      console.log(`\x1b[34m\x1b[1m
         🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈
                                       \x1b[1m🚀🎉✅ Mongodb connected successfully.✅ 🎉🚀
         🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈🌈
         \x1b[0m
       `);
   })

   .catch((err) => {
      console.error('❌ Error connecting to MongoDB ❌');
      console.error(err);
   });

export { mongoose, conn };
