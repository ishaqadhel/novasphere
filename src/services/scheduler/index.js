import cron from 'node-cron';
import pmrAlertJob from './jobs/pmr-alert-job.js';
import srmaAutoRerunJob from './jobs/srma-auto-rerun-job.js';

class SchedulerService {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) {
      console.log('Scheduler is already running');
      return;
    }

    console.log('Starting scheduler service...');

    // PMR Pre-Delay Alert Job - runs every hour
    const pmrAlertCronJob = cron.schedule(
      // '0 * * * *', -- FIXME: TEMPORARILY SET TO RUN EVERY MINUTE FOR DEMO
      '* * * * *',
      async () => {
        console.log(`[${new Date().toISOString()}] Running PMR alert job...`);
        try {
          await pmrAlertJob.execute();
        } catch (error) {
          console.error('PMR alert job failed:', error.message);
        }
      },
      {
        scheduled: false,
        timezone: 'Asia/Taipei',
      }
    );

    this.jobs.set('pmr-alert', pmrAlertCronJob);
    pmrAlertCronJob.start();

    // SRMA Auto-Rerun Job - runs daily at 2am
    const srmaRerunCronJob = cron.schedule(
      '0 2 * * *',
      async () => {
        console.log(`[${new Date().toISOString()}] Running SRMA auto-rerun job...`);
        try {
          await srmaAutoRerunJob.execute();
        } catch (error) {
          console.error('SRMA auto-rerun job failed:', error.message);
        }
      },
      {
        scheduled: false,
        timezone: 'Asia/Taipei',
      }
    );

    this.jobs.set('srma-auto-rerun', srmaRerunCronJob);
    srmaRerunCronJob.start();

    this.isRunning = true;
    console.log('Scheduler service started');
    console.log('- PMR Alert Job: Every hour (0 * * * *)');
    console.log('- SRMA Auto-Rerun Job: Daily at 2am (0 2 * * *)');
  }

  stop() {
    if (!this.isRunning) {
      return;
    }

    console.log('Stopping scheduler service...');
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`- Stopped job: ${name}`);
    });
    this.jobs.clear();
    this.isRunning = false;
  }
}

export default new SchedulerService();
