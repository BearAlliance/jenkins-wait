import 'core-js/stable';

export function delay(timeout, v) {
  return new Promise(function(resolve) {
    setTimeout(resolve.bind(null, v), timeout);
  });
}
