import app from './app.js';
import { connectDB } from './config/db.js';
import { ENV } from './config/env.js';
import { TestRunnerWorker } from './services/testRunnerWorker.js';

const PORT = ENV.PORT || 5000;

async function startServer() {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`[Server] DesignCheck AI API running on http://localhost:${PORT}`);
      console.log(`[Server] Environment: ${ENV.NODE_ENV}`);
      console.log(`[Server] Static Previews mounted at http://localhost:${PORT}/preview/:previewId/`);
    });

    // Integrated worker polling (ensures test jobs process even if separate worker isn't started)
    const workerInterval = setInterval(async () => {
      try {
        await TestRunnerWorker.processNextJob();
      } catch (err) {
        console.error('[Background Worker Error]:', err.message);
      }
    }, 3000);

    const shutdown = async () => {
      console.log('\n[Server] Shutting down gracefully...');
      clearInterval(workerInterval);
      server.close(() => {
        console.log('[Server] HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error(`[Server Fatal Error] Failed to start: ${error.message}`);
    process.exit(1);
  }
}

startServer();
