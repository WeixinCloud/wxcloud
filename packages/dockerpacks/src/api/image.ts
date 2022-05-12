// TODO: 用更好的方式同步 image.ts 中的定义
export interface Image {
  fullVersion: string;
  fullVersionTag: string;
  tags: ImageTag[];
}

export interface MatchedImage extends Image {
  matchedTags: ImageTag[];
}

export interface ImageTag {
  raw: string;
  version: string | null;
  categories: string[];
}
