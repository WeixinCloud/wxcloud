import { fetchUrl } from '@utils/fetch';
import { ImageWrapper } from '@utils/image-wrapper';
import { Response } from 'node-fetch';
import { MatchedImage } from './image';

export class ServerApi {
  static TCB_SHANGHAI = new ServerApi(
    'https://dockerpacks-server-1178816-1304825656.ap-shanghai.run.tcloudbase.com'
  );

  constructor(private readonly serverUrl: string) {}

  getServerUrl() {
    return new URL(this.serverUrl);
  }

  async queryNpmPackage(name: string, versionConstraint: string) {
    const url = new URL(`npm/${name}/${versionConstraint}`, this.serverUrl);
    const response = await fetchUrl(url.toString());

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      return this.handleUnexpectedResponse(response);
    }

    const version = await response.text();
    return version;
  }

  async queryRuntimeImage(runtime: string, versionConstraint: string, categories: string[] = []) {
    const url = new URL(`${runtime}/${versionConstraint}`, this.serverUrl);
    categories.forEach(item => url.searchParams.append('category', item));
    const response = await fetchUrl(url.toString());

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      return this.handleUnexpectedResponse(response);
    }

    const image = (await response.json()) as MatchedImage;
    return new ImageWrapper(image);
  }

  async queryRecommendedImage(runtime: string, categories: string[] = []) {
    const url = new URL(`recommend/${runtime}`, this.serverUrl);
    categories.forEach(item => url.searchParams.append('category', item));
    const response = await fetchUrl(url.toString());

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      return this.handleUnexpectedResponse(response);
    }

    const image = (await response.json()) as MatchedImage;
    return new ImageWrapper(image);
  }

  private handleUnexpectedResponse(response: Response): never {
    throw new Error(
      `无法处理的服务器响应: ${response.text}(${response.headers.get('X-Request-Id')})`
    );
  }
}
