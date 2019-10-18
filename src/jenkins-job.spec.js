import 'regenerator-runtime';
import nock from 'nock';
import { JenkinsJob } from './jenkins-job';

describe('JenkinsJob', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  describe('verifyBothUserPass', () => {
    describe('when one is missing', () => {
      it.skip('should throw if only username is present', () => {
        const instance = new JenkinsJob({
          baseJenkins: 'ci.mycompany.com',
          jobLocation: 'topLevel/myProject',
          username: 'itsme',
          pollInterval: 1000,
          useHttps: true
        });
        expect(() => {
          instance.createUrl(true);
        }).toThrow();
      });

      it.skip('should throw if only password is present', () => {
        const instance = new JenkinsJob({
          baseJenkins: 'ci.mycompany.com',
          jobLocation: 'topLevel/myProject',
          password: 'securepassword',
          pollInterval: 1000,
          useHttps: true
        });
        expect(() => {
          instance.createUrl(true);
        }).toThrow();
      });
    });
  });

  describe('createUrl', () => {
    describe('https', () => {
      it('should be used if it is called for', () => {
        const instance = new JenkinsJob({
          baseJenkins: 'ci.mycompany.com',
          jobLocation: 'topLevel/myProject',
          username: 'itsme',
          password: 'securepassword',
          pollInterval: 1000,
          useHttps: true
        });
        let url = instance.createUrl(false);
        expect(url).toEqual('https://ci.mycompany.com/topLevel/myProject');
      });

      it('should not be used if it is not called for', () => {
        const instance = new JenkinsJob({
          baseJenkins: 'ci.mycompany.com',
          jobLocation: 'topLevel/myProject',
          username: 'itsme',
          password: 'securepassword',
          pollInterval: 1000,
          useHttps: false
        });
        let url = instance.createUrl(false);
        expect(url).toEqual('http://ci.mycompany.com/topLevel/myProject');
      });
    });
    describe('url formatting', () => {
      it('should strip protocol from the base url', () => {
        const instance = new JenkinsJob({
          baseJenkins: 'http://ci.mycompany.com',
          jobLocation: 'topLevel/myProject',
          username: 'itsme',
          password: 'securepassword',
          pollInterval: 1000,
          useHttps: true
        });
        const url = instance.createUrl(false);
        expect(url).toEqual('https://ci.mycompany.com/topLevel/myProject');
      });
      it('should tolerate following slashes from the base url', () => {
        const instance = new JenkinsJob({
          baseJenkins: 'ci.mycompany.com/',
          jobLocation: 'topLevel/myProject',
          username: 'itsme',
          password: 'securepassword',
          pollInterval: 1000,
          useHttps: false
        });
        const url = instance.createUrl(false);
        expect(url).toEqual('http://ci.mycompany.com/topLevel/myProject');
      });
      it('should tolerate leading slashes from the job location', () => {
        const instance = new JenkinsJob({
          baseJenkins: 'ci.mycompany.com',
          jobLocation: '/topLevel/myProject',
          username: 'itsme',
          password: 'securepassword',
          pollInterval: 1000,
          useHttps: false
        });
        const url = instance.createUrl(false);
        expect(url).toEqual('http://ci.mycompany.com/topLevel/myProject');
      });
      it('should tolerate following slashes from the job location', () => {
        const instance = new JenkinsJob({
          baseJenkins: 'ci.mycompany.com',
          jobLocation: 'topLevel/myProject/',
          username: 'itsme',
          password: 'securepassword',
          pollInterval: 1000,
          useHttps: false
        });
        const url = instance.createUrl(false);
        expect(url).toEqual('http://ci.mycompany.com/topLevel/myProject');
      });
    });
  });

  describe('doesProjectExist', () => {
    let instance;
    beforeEach(() => {
      instance = new JenkinsJob({
        baseJenkins: 'ci.mycompany.com',
        jobLocation: 'topLevel/myProject',
        username: 'itsme',
        password: 'securepassword',
        pollInterval: 1000,
        useHttps: false
      });
    });

    describe('when the job exists', () => {
      it('should return true when the job exists', () => {
        nock('http://ci.mycompany.com')
          .get('/topLevel/myProject/api/json')
          .reply(200, { job: true });

        return instance
          .doesProjectExist()
          .then(res => {
            expect(res).toEqual(true);
          })
          .catch(e => {
            fail();
          });
      });
    });

    describe('when the request fails', () => {
      it('should return false', () => {
        nock('http://ci.mycompany.com')
          .get('/topLevel/myProject/api/json')
          .reply(400);
        return instance
          .doesProjectExist()
          .then(res => {
            expect(res).toEqual(false);
          })
          .catch(e => {
            fail();
          });
      });
    });

    describe('when the response body is not json', () => {
      it('should return false', () => {
        nock('http://ci.mycompany.com')
          .get('/topLevel/myProject/api/json')
          .reply(200, '<body>someHtml</body>');
        return instance
          .doesProjectExist()
          .then(res => {
            expect(res).toEqual(false);
          })
          .catch(e => {
            fail();
          });
      });
    });
  });

  describe('getNextBuildNumber', () => {
    let instance;
    beforeEach(() => {
      instance = new JenkinsJob({
        baseJenkins: 'ci.mycompany.com',
        jobLocation: 'topLevel/myProject',
        username: 'itsme',
        password: 'securepassword',
        pollInterval: 1000,
        useHttps: false
      });
    });
    describe('success', () => {
      it('should return the build number', () => {
        nock('http://ci.mycompany.com')
          .get('/topLevel/myProject/api/json')
          .reply(200, { nextBuildNumber: 42 });

        return instance
          .getNextBuildNumber()
          .then(res => {
            expect(res).toEqual(42);
          })
          .catch(e => {
            fail();
          });
      });
    });
    describe('call failure', () => {
      it('should reject', done => {
        nock('http://ci.mycompany.com')
          .get('/topLevel/myProject/api/json')
          .reply(500);

        return instance
          .getNextBuildNumber()
          .then(() => {
            fail();
          })
          .catch(e => {
            done();
          });
      });
    });
    describe('malformed response', () => {
      it('should reject', done => {
        nock('http://ci.mycompany.com')
          .get('/topLevel/myProject/api/json')
          .reply(200, '<body>someHtml</body>');

        return instance
          .getNextBuildNumber()
          .then(() => {
            fail();
          })
          .catch(e => {
            done();
          });
      });
    });
  });

  describe('build', () => {
    let instance;
    beforeEach(() => {
      instance = new JenkinsJob({
        baseJenkins: 'ci.mycompany.com',
        jobLocation: 'topLevel/myProject',
        username: 'itsme',
        password: 'securepassword',
        pollInterval: 1000,
        useHttps: false
      });
    });

    it('should send the request with auth', () => {
      nock('http://itsme:securepassword@ci.mycompany.com')
        .post('/topLevel/myProject/build')
        .reply(201);

      return instance.build().then(() => {
        expect(nock.isDone()).toEqual(true);
      });
    });

    describe('201 response', () => {
      it('should resolve', done => {
        nock('http://itsme:securepassword@ci.mycompany.com')
          .post('/topLevel/myProject/build')
          .reply(201);

        instance
          .build()
          .then(() => {
            done();
          })
          .catch(() => {
            fail();
          });
      });
    });

    describe('non 201 reponse', () => {
      it('should reject', done => {
        nock('http://itsme:securepassword@ci.mycompany.com')
          .post('/topLevel/myProject/build')
          .reply(403);

        instance
          .build()
          .then(() => {
            fail();
          })
          .catch(() => {
            done();
          });
      });
    });
  });

  describe('waitForBuildToStart', () => {
    const BUILD_NUMBER = 21;

    let instance;
    beforeEach(() => {
      instance = new JenkinsJob({
        baseJenkins: 'ci.mycompany.com',
        jobLocation: 'topLevel/myProject',
        username: 'itsme',
        password: 'securepassword',
        pollInterval: 1000,
        useHttps: true
      });
    });

    describe('when the build is not in the queue', () => {
      beforeEach(() => {
        nock('https://ci.mycompany.com')
          .get('/topLevel/myProject/api/json')
          .reply(200, {
            builds: [
              { number: 19, url: 'http://19' },
              { number: 20, url: 'http://20' }
            ]
          });
      });
      it.skip('should retry after the poll interval', () => {});
    });

    describe('when the build is in the queue', () => {
      beforeEach(() => {
        nock('https://ci.mycompany.com')
          .get('/topLevel/myProject/api/json')
          .reply(200, {
            builds: [
              { number: 19, url: 'https://19' },
              { number: 20, url: 'https://20' },
              {
                number: BUILD_NUMBER,
                url: `https://ci.mycompany.com/topLevel/myProject/${BUILD_NUMBER}`
              },
              { number: 22, url: 'https://22' }
            ]
          });
      });

      describe('when the build has not yet started', () => {
        it.skip('should retry after the poll interval', () => {
          jest.useFakeTimers();

          nock('https://ci.mycompany.com')
            .get('/topLevel/myProject/api/json')
            .reply(200, {
              builds: [
                { number: 19, url: 'http://19' },
                { number: 20, url: 'http://20' },
                { number: 21, url: 'http://21' },
                { number: 22, url: 'http://22' }
              ]
            });

          instance.waitForBuildToStart(23).then(res => {
            expect(res).toEqual('http://23');
            done();
          });

          nock('https://ci.mycompany.com')
            .get('/topLevel/myProject/api/json')
            .reply(200, {
              builds: [
                { number: 21, url: 'http://21' },
                { number: 22, url: 'http://22' },
                { number: 23, url: 'http://23' }
              ]
            });

          jest.runAllTimers();
        });
      });

      describe('when the build has started', () => {
        beforeEach(() => {
          nock('https://ci.mycompany.com')
            .get(`/topLevel/myProject/${BUILD_NUMBER}/api/json`)
            .reply(200, {
              duration: 1
            });
        });

        it('should return the build url', () => {
          return instance.waitForBuildToStart(BUILD_NUMBER).then(res => {
            expect(res).toEqual(
              `https://ci.mycompany.com/topLevel/myProject/${BUILD_NUMBER}`
            );
          });
        });
      });

      describe('error', () => {
        it('should throw', () => {
          nock('https://ci.mycompany.com')
            .get(`/topLevel/myProject/${BUILD_NUMBER}/api/json`)
            .reply(500);

          expect(async () => {
            await instance.waitForBuildToStart(BUILD_NUMBER).toThrow();
          });
        });
      });
    });

    describe('error', () => {
      it('should throw', () => {
        nock('https://ci.mycompany.com')
          .get('/topLevel/myProject/api/json')
          .reply(500);

        expect(async () => {
          await instance.waitForBuildToStart(BUILD_NUMBER).toThrow();
        });
      });
    });
  });

  describe('waitForStatus', () => {
    const buildUrl = 'https://ci.mycompany.com/topLevel/myProject/21/';
    let instance;
    beforeEach(() => {
      instance = new JenkinsJob({
        baseJenkins: 'ci.mycompany.com',
        jobLocation: 'topLevel/myProject',
        username: 'itsme',
        password: 'securepassword',
        pollInterval: 1000,
        useHttps: true
      });
    });

    it('should return the status of the given job', () => {
      nock('https://ci.mycompany.com')
        .get('/topLevel/myProject/21/api/json')
        .reply(200, {
          result: 'SUCCESS'
        });

      nock('https://ci.mycompany.com')
        .get('/topLevel/myProject/21/consoleText')
        .reply(200, 'some output');

      return instance.waitForStatus(buildUrl).then(res => {
        expect(res.result).toEqual('SUCCESS');
      });
    });
    describe('error', () => {
      it('should throw', () => {
        nock('https://ci.mycompany.com')
          .get('/topLevel/myProject/21/api/json')
          .reply(500);

        expect(async () => {
          await instance.waitForStatus(buildUrl).toThrow();
        });
      });
    });
    describe('retry', () => {
      it.skip('should retry every interval until it succeeds or fails', () => {});
    });
  });
});
