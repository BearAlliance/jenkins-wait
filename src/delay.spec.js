import { delay } from './delay';

describe('delay', () => {
  it('should resolve after the timeout', done => {
    jest.useFakeTimers();

    delay(5000)
      .then(() => {
        done();
      })
      .catch(() => {
        fail();
      });

    jest.advanceTimersByTime(5000);
  });
});
