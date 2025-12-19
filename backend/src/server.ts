import app from './app';
import { env } from './config/environment';
import { connectDatabase } from './config/database';

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Start Express server
    const server = app.listen(env.PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║   Beat Saber Backend Server Started   ║
╠════════════════════════════════════════╣
║ Environment: ${env.NODE_ENV.padEnd(24)}║
║ Port:        ${String(env.PORT).padEnd(24)}║
║ Database:    Connected                 ║
╚════════════════════════════════════════╝
      `);
      console.log(`Server is running on http://localhost:${env.PORT}`);
      console.log(`Health check: http://localhost:${env.PORT}/health`);
    });

    // Graceful shutdown
    const gracefulShutdown = async () => {
      console.log('\nReceived shutdown signal. Closing server gracefully...');

      server.close(async () => {
        console.log('HTTP server closed');

        try {
          const { disconnectDatabase } = await import('./config/database');
          await disconnectDatabase();
          console.log('Database connection closed');
          process.exit(0);
        } catch (error) {
          console.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
