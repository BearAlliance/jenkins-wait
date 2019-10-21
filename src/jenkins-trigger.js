import 'core-js/stable';
import listr from 'listr';
import isCi from 'is-ci';
import { mapBuildResultToStatusCode } from './status-code-map';
import { JenkinsJob } from './jenkins-job';

export class JenkinsTrigger {
  constructor({
    baseJenkins,
    jobLocation,
    username,
    password,
    pollInterval,
    useHttps = true
  }) {
    this.pollInterval = pollInterval;

    this.jenkinsJob = new JenkinsJob({
      baseJenkins,
      jobLocation,
      username,
      password,
      useHttps
    });
  }

  runJob({ buildParameters, silent = false, verbose = false }) {
    const logLevel = this.getLogLevel(silent, verbose);

    const tasks = new listr(
      [
        {
          title: 'Finding the project',
          task: (ctx, task) => this.ensureProjectExists(ctx, task)
        },
        {
          title: 'Getting next build number',
          exitOnError: true,
          task: (ctx, task) => this.nextBuildNumber(ctx, task)
        },
        {
          title: 'Triggering build job',
          exitOnError: true,
          task: (ctx, task) => this.triggerJob(ctx, task)
        },
        {
          title: 'Waiting for build to start',
          exitOnError: true,
          task: (ctx, task) => this.getBuildUrl(ctx, task)
        },
        {
          title: 'Waiting for build to finish',
          exitOnError: true,
          task: (ctx, task) => this.getBuildStatus(ctx, task)
        }
      ],
      {
        renderer: logLevel
      }
    );

    return tasks.run({ buildParameters, isCi });
  }

  getLogLevel(silent, verbose) {
    if (verbose) {
      return 'verbose';
    } else if (silent) {
      return 'silent';
    } else {
      return 'default';
    }
  }

  ensureProjectExists(ctx, task) {
    return this.jenkinsJob.doesProjectExist().then(projectExists => {
      if (!projectExists) {
        return Promise.reject(
          new Error(`Cannot find project, or unable to authenticate`)
        );
      }
      task.title = 'Project found';
    });
  }

  nextBuildNumber(ctx, task) {
    return this.jenkinsJob
      .getNextBuildNumber()
      .then(nextBuildNumber => {
        ctx.nextBuildNumber = nextBuildNumber;
        task.title = `Next build number will be ${nextBuildNumber}`;
      })
      .catch(e => {
        return Promise.reject(
          new Error(
            `Error getting build number: ${e.statusCode || ''} ${e.message}`
          )
        );
      });
  }

  triggerJob(ctx, task) {
    return this.jenkinsJob
      .build(ctx.buildParameters)
      .then(buildUrl => {
        task.title = `Job added to the queue => ${buildUrl}/${ctx.nextBuildNumber}`;
      })
      .catch(e => {
        return Promise.reject(
          new Error(
            `Error triggering the job: ${e.statusCode || ''} ${e.message}`
          )
        );
      });
  }

  getBuildUrl(ctx, task) {
    let intervalId;
    if (ctx.isCi) {
      intervalId = this.waitTimer(task);
    }

    return this.jenkinsJob
      .waitForBuildToStart(ctx.nextBulidNumber, this.pollInterval)
      .then(url => {
        ctx.buildUrl = url;
        task.title = 'Build started';
      })
      .catch(e => {
        return Promise.reject(
          new Error(
            `Error waiting for the build to start: ${e.statusCode || ''} ${
              e.message
            }`
          )
        );
      })
      .finally(() => {
        intervalId && clearInterval(intervalId);
      });
  }

  getBuildStatus(ctx, task) {
    let intervalId;
    if (ctx.isCi) {
      intervalId = this.waitTimer(task);
    }

    return this.jenkinsJob
      .waitForStatus(ctx.buildUrl, this.pollInterval)
      .then(({ result, consoleText }) => {
        const exitCode = mapBuildResultToStatusCode(result);
        ctx.consoleText = consoleText;
        ctx.buildStatus = result;
        ctx.exitCode = exitCode;
        task.title = `Build ${result}`;
        if (exitCode !== 0) {
          return Promise.reject(new Error('Build not successful'));
        }
      })
      .catch(e => {
        return Promise.reject(
          new Error(
            `Error getting build status: ${e.statusCode || ''} ${e.message}`
          )
        );
      })
      .finally(() => {
        intervalId && clearInterval(intervalId);
      });
  }

  waitTimer(task) {
    let waitTime = 0;
    return setInterval(() => {
      waitTime++;
      task.output = `Waiting for ${waitTime}s`;
    }, 1000);
  }
}
