import { ImageTag, MatchedImage } from '@api/image';

export class ImageWrapper {
  constructor(private readonly image: MatchedImage) {}

  getFullVersion() {
    return this.image.fullVersion;
  }

  getFullVersionTag() {
    return this.image.fullVersionTag;
  }

  getMostGeneralTag() {
    if (!this.image.matchedTags.length) {
      throw new Error('unexpected matchedTags of image');
    }
    const sorted = [...this.image.matchedTags].sort(sortByGenerality);
    return sorted[0];
  }
}

function sortByGenerality(a: ImageTag, b: ImageTag) {
  switch (true) {
    case !!a.version && !!b.version:
      return countOfDots(a.version!) - countOfDots(b.version!);
    case !a.version && !b.version:
      return 0;
    case !a.version:
      return -1;
    case !b.version:
      return 1;
  }
  throw new Error('unreachable');
}

function countOfDots(input: string) {
  return [...input].filter(c => c === '.').length;
}
