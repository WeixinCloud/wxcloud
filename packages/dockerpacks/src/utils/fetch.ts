import { merge } from 'lodash';
import fetch, { RequestInfo, RequestInit } from 'node-fetch';
import { DOCKERPACKS_VERSION } from './version';

export function fetchUrl(url: RequestInfo, init?: RequestInit) {
  const source: RequestInit = {
    headers: { 'User-Agent': `Dockerpacks ${DOCKERPACKS_VERSION}` }
  };
  return fetch(url, merge(init ?? {}, source));
}
