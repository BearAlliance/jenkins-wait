import { mapBuildResultToStatusCode } from './status-code-map';

describe('mapBuildResultToStatusCode', () => {
  describe('SUCCESS result', () => {
    it('should return 0', () => {
      const code = mapBuildResultToStatusCode('SUCCESS');
      expect(code).toEqual(0);
    });
  });
  describe('failure modes', () => {
    const failureStatuses = ['FAILURE', 'ABORTED', 'whatever'];

    failureStatuses.forEach(status => {
      it(`should return 1 for ${status}`, () => {
        const code = mapBuildResultToStatusCode(status);
        expect(code).toEqual(1);
      });
    });
  });
});
