import dotenv from 'dotenv';
import http from 'http';
import app from './app.js';
import { connectDB } from './config/db.js';
import { initSocket } from './sockets/index.js';

dotenv.config();

const port = Number(process.env.PORT || 4000);

const bootstrap = async () => {
  await connectDB();

  const httpServer = http.createServer(app);
  const { io } = initSocket(httpServer);
  app.set('io', io);

  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port}`);
  });
}; // ✅ THIS WAS MISSING

bootstrap().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
