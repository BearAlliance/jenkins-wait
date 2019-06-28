import 'core-js/stable';

export function mapBuildResultToStatusCode(result) {
  return result === 'SUCCESS' ? 0 : 1;
}
