import { HttpProxyAgent, HttpsProxyAgent } from 'hpagent';
import { getConfiguration } from '../configuration/configuration';

interface IAgentInfo {
  proxyURL: string;
  http: HttpProxyAgent;
  https: HttpsProxyAgent;
}

const agents: Record<string, IAgentInfo> = {};

export const getProxyAgent = (): IAgentInfo | undefined => {
  const proxyURL = getConfiguration().proxy;
  if (!proxyURL) {
    return undefined;
  }

  if (!agents[proxyURL]) {
    agents[proxyURL] = {
      proxyURL,
      http: new HttpProxyAgent({
        keepAlive: true,
        proxy: proxyURL
      }),
      https: new HttpsProxyAgent({
        keepAlive: true,
        proxy: proxyURL
      })
    };
  }
  return agents[proxyURL];
};
