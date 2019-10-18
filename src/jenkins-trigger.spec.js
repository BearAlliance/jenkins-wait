import 'regenerator-runtime';
import { JenkinsTrigger } from './jenkins-trigger';

describe('JenkinsTrigger', () => {
  let instance;
  let ctx;
  let task;

  beforeEach(() => {
    instance = new JenkinsTrigger({
      baseJenkins: 'ci.mycompany.com',
      jobLocation: 'topLevel/myProject',
      username: 'itsme',
      password: 'securepassword',
      pollInterval: 1000,
      useHttps: true,
      silent: false
    });

    ctx = {};
    task = {};
  });

  describe('steps', () => {
    describe('ensureProjectExists', () => {
      it('should reject if the project does not exist', async () => {
        instance.jenkinsJob.doesProjectExist = jest
          .fn()
          .mockImplementation(() => Promise.resolve(false));

        return expect(
          instance.ensureProjectExists(ctx, task)
        ).rejects.toBeInstanceOf(Error);
      });
      it('should change the title when the project is found', done => {
        instance.jenkinsJob.doesProjectExist = jest
          .fn()
          .mockImplementation(() => Promise.resolve(true));

        instance.ensureProjectExists(ctx, task).then(() => {
          expect(task.title).toEqual('Project found');
          done();
        });
      });
    });

    describe('nextBuildNumber', () => {
      it('should reject if there is an error', () => {
        instance.jenkinsJob.getNextBuildNumber = jest
          .fn()
          .mockImplementation(() => Promise.reject('idk'));

        return expect(
          instance.nextBuildNumber(ctx, task)
        ).rejects.toBeInstanceOf(Error);
      });
      it('should change the title and context to the next build number', () => {
        instance.jenkinsJob.getNextBuildNumber = jest
          .fn()
          .mockImplementation(() => Promise.resolve(42));

        return instance
          .nextBuildNumber(ctx, task)
          .then(() => {
            expect(ctx.nextBulidNumber).toEqual(42);
            expect(task.title).toEqual('Next build number will be 42');
          })
          .catch(() => {
            fail();
          });
      });
    });

    describe('triggerJob', () => {
      describe('error', () => {
        it('should reject', () => {
          instance.jenkinsJob.build = jest
            .fn()
            .mockImplementation(() => Promise.reject('idk'));

          return expect(instance.triggerJob(ctx, task)).rejects.toBeInstanceOf(
            Error
          );
        });
      });
      describe('success', () => {
        it('should change the title', done => {
          instance.jenkinsJob.build = jest
            .fn()
            .mockImplementation(() => Promise.resolve());

          instance.triggerJob(ctx, task).then(() => {
            expect(
              task.title.startsWith('Job added to the queue')
            ).toBeTruthy();
            done();
          });
        });
      });
    });

    describe('getBuildUrl', () => {
      describe('error', () => {
        it('should reject', () => {
          instance.jenkinsJob.waitForBuildToStart = jest
            .fn()
            .mockImplementation(() => Promise.reject());

          return expect(instance.getBuildUrl(ctx, task)).rejects.toBeInstanceOf(
            Error
          );
        });
      });
      describe('success', () => {
        const buildUrl = 'http://somewhere.jenkins/build/21';

        it('should set the build url on the context', () => {
          instance.jenkinsJob.waitForBuildToStart = jest
            .fn()
            .mockImplementation(() => Promise.resolve(buildUrl));

          return instance.getBuildUrl(ctx, task).then(() => {
            expect(ctx.buildUrl).toEqual(buildUrl);
          });
        });

        it('should change the task title', () => {
          instance.jenkinsJob.waitForBuildToStart = jest
            .fn()
            .mockImplementation(() => Promise.resolve(buildUrl));

          return instance.getBuildUrl(ctx, task).then(() => {
            expect(task.title).toEqual('Build started');
          });
        });
      });
    });

    describe('getBuildStatus', () => {
      describe('error', () => {
        it('should reject', () => {
          instance.jenkinsJob.waitForStatus = jest
            .fn()
            .mockImplementation(() => Promise.reject());

          return expect(
            instance.getBuildStatus(ctx, task)
          ).rejects.toBeInstanceOf(Error);
        });
      });
      describe('non-successful status', () => {
        it('should reject', () => {
          instance.jenkinsJob.waitForStatus = jest
            .fn()
            .mockImplementation(() => Promise.resolve('FAILURE'));

          return expect(
            instance.getBuildStatus(ctx, task)
          ).rejects.toBeInstanceOf(Error);
        });
      });
      describe('success', () => {
        it('should update the task title', () => {
          instance.jenkinsJob.waitForStatus = jest
            .fn()
            .mockImplementation(() => Promise.resolve('SUCCESS'));

          return instance.getBuildStatus(ctx, task).then(() => {
            expect(task.title).toEqual('Build SUCCESS');
          });
        });
      });
    });
  });
});
