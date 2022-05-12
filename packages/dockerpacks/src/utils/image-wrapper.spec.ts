import { MatchedImage } from '@api/image';
import { describe, expect, it } from 'vitest';
import { ImageWrapper } from './image-wrapper';
import { NonEmptyArray } from './types';

function makeImage(versions: NonEmptyArray<string | null>): MatchedImage {
  return {
    fullVersion: '',
    fullVersionTag: '',
    tags: [],
    matchedTags: versions.map(version => ({
      raw: '',
      version,
      categories: []
    }))
  };
}

const CASES = [
  [makeImage([null, '1.2.3', '1.2', '1']), null],
  [makeImage(['1', '1.2', '1.2.3']), '1'],
  [makeImage(['1.2.3', '1.2', '1']), '1']
] as const;

describe('getMostGeneralTag', () => {
  describe.each(CASES)('test case %#', (image, expected) => {
    it('should return correct result', () => {
      const wrapper = new ImageWrapper(image);
      expect(wrapper.getMostGeneralTag().version).toEqual(expected);
    });
  });
});
