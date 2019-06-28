export function parseColonSeparatedParams(params) {
  return params
    ? params.reduce((acc, param) => {
        const split = param.split(':');
        const key = split[0];
        const value = split[1];

        if (key && value) {
          acc[key] = value;
        }
        return acc;
      }, {})
    : {};
}
