import { parseColonSeparatedParams } from './parse-param-array';

describe('parseColonSeparatedParams', () => {
  it('should take an array of colon separated key-value pairs and return an object representation', () => {
    const parsed = parseColonSeparatedParams(['abc:123', '234:qwe']);

    expect(parsed).toEqual({ abc: '123', '234': 'qwe' });
  });

  it('should drop params without a corresponding value', () => {
    const parsed = parseColonSeparatedParams(['abc', '234:qwe']);
    expect(parsed).toEqual({ '234': 'qwe' });
  });

  it('should handle undefined', () => {
    const parsed = parseColonSeparatedParams();
    expect(parsed).toEqual({});
  });
});
