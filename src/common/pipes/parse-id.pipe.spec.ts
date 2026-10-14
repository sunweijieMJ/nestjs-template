import { BadRequestException } from '@nestjs/common';
import { ParseIdPipe } from './parse-id.pipe';

describe('ParseIdPipe', () => {
  const pipe = new ParseIdPipe();

  it('should parse a positive integer id', () => {
    expect(pipe.transform('42')).toBe(42);
  });

  it.each(['abc', '0', '-1', '1.5', '2147483648', ''])('should reject %p with 400', (value) => {
    expect(() => pipe.transform(value)).toThrow(BadRequestException);
  });
});
