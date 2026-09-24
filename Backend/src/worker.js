import { connectDB } from './config/db.js';
import { TestRunnerWorker } from './services/testRunnerWorker.js';

let isRunning = true;

async function startWorker() {
  console.log('[Worker Process] Initializing standalone visual QA test worker...');
  await connectDB();
  console.log('[Worker Process] Connected to MongoDB. Polling for queued test jobs...');

  while (isRunning) {
    try {
      const job = await TestRunnerWorker.processNextJob();
      if (!job) {
        // Sleep for 2 seconds before next poll
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (err) {
      console.error('[Worker Error in Loop]:', err);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  console.log('[Worker Process] Gracefully exited.');
  process.exit(0);
}

process.on('SIGINT', () => {
  console.log('\n[Worker Process] Stopping...');
  isRunning = false;
});

process.on('SIGTERM', () => {
  console.log('\n[Worker Process] Terminating...');
  isRunning = false;
});

startWorker();
