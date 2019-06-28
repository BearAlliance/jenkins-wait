import 'core-js/stable';
import { delay } from './delay';
import request from 'request-promise';

const DEFAULT_POLL_INTERVAL = 1000;

export class JenkinsJob {
  constructor({ baseJenkins, jobLocation, username, password, useHttps }) {
    this.baseJenkins = baseJenkins;
    this.jobLocation = jobLocation;
    this.username = username;
    this.password = password;
    this.useHttps = useHttps;

    this.verifyBothUserPass(this.username, this.password);
    this.url = this.createUrl();
  }

  createUrl() {
    const { useHttps, baseJenkins, jobLocation } = this;
    const protocol = `${useHttps ? 'https://' : 'http://'}`;

    const baseTrimmed = baseJenkins
      .replace(/\/$/, '')
      .replace(/^https?:\/\//, '');
    const jobLocationTrimmed = jobLocation
      .replace(/^\//, '')
      .replace(/\/$/, '');

    const basePlusJob = `${baseTrimmed}/${jobLocationTrimmed}`;

    return `${protocol}${basePlusJob}`;
  }

  getNextBuildNumber() {
    const url = this.url + '/api/json';
    return request
      .get(url, {
        auth: {
          user: this.username,
          pass: this.password
        }
      })
      .then(res => {
        const data = JSON.parse(res);
        return data.nextBuildNumber;
      });
  }

  verifyBothUserPass(username, password) {
    if ((username && !password) || (!username && password)) {
      throw new Error('Must supply both username and password');
    }
  }

  waitForBuildToStart(buildNumber, pollInterval = DEFAULT_POLL_INTERVAL) {
    const url = this.url + '/api/json';

    return request
      .get(url, {
        auth: {
          user: this.username,
          pass: this.password
        }
      })
      .then(res => {
        const data = JSON.parse(res);

        // Build is in the queue when it's number has been assigned
        const buildQueued = data.builds.some(
          build => build.number === buildNumber
        );

        if (buildQueued) {
          const build = data.builds.find(build => build.number === buildNumber);
          return request
            .get(build.url + '/api/json', {
              auth: {
                username: this.username,
                password: this.password
              }
            })
            .then(res => {
              // Build has actually started when it has a duration
              const data = JSON.parse(res);
              return data.duration > 0
                ? build.url
                : delay(pollInterval).then(() =>
                    this.waitForBuildToStart(buildNumber)
                  );
            });
        } else {
          return delay(pollInterval).then(() =>
            this.waitForBuildToStart(buildNumber)
          );
        }
      });
  }

  doesProjectExist() {
    const jobUrl = this.url + '/api/json';

    return request
      .get(jobUrl, {
        auth: {
          user: this.username,
          pass: this.password
        }
      })
      .then(res => {
        try {
          JSON.parse(res);
          return true;
        } catch {
          return false;
        }
      })
      .catch(() => {
        return false;
      });
  }

  build(buildParameters) {
    const url = this.url + '/build';
    const parameterUrl = this.url + '/buildWithParameters';

    if (buildParameters) {
      return request.post(parameterUrl, {
        auth: {
          user: this.username,
          pass: this.password
        },
        form: buildParameters
      });
    }

    return request.post(url, {
      auth: {
        user: this.username,
        pass: this.password
      }
    });
  }

  waitForStatus(jobUrl, pollInterval = DEFAULT_POLL_INTERVAL) {
    const buildUrl = jobUrl + 'api/json';

    return request
      .get(buildUrl, {
        auth: {
          user: this.username,
          pass: this.password
        }
      })
      .then(res => {
        const data = JSON.parse(res);
        const result = data.result;
        if (result !== null) {
          return result;
        } else {
          return delay(pollInterval).then(() => this.waitForStatus(jobUrl));
        }
      });
  }
}
