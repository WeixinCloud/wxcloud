import crypto from 'crypto'
import * as cloudAPI from './cloudapi/src/index'
import axios from "axios";
import { BASE_URL, fetchApiOptions } from './base';
import { readLoginState } from '../utils/auth';
import { merge } from 'lodash';
import { getApiCommonParameters } from './common';

export function initCloudAPI(appid: string) {
  cloudAPI.setDefaultAppID(appid)
  cloudAPI.setTransactType(cloudAPI.TransactType.IDE)
  cloudAPI.setRequest(transactRequest as any)
}

const SERVICE_CLOUD_URL: Record<string, string> = {
  scf: 'https://scf.tencentcloudapi.com',
  flexdb: 'https://flexdb.tencentcloudapi.com',
  tcb: 'https://tcb.tencentcloudapi.com',
}
const DIRECT_CLOUD_API_SET = new Set(['UpdateFunctionCode', 'CreateFunction'])

async function transactRequest<T = any>(
  options: cloudAPI.IRequestOptions & fetchApiOptions
): Promise<T> {
  const appid = options.wxCloudConfig?.appid || (await readLoginState()).appid;
  const privateKey =
    options.wxCloudConfig?.privateKey || (await readLoginState()).privateKey;
  if (DIRECT_CLOUD_API_SET.has(options.identity.action || '') && Boolean(SERVICE_CLOUD_URL[options.identity.service])) {
    const { data } = await axios.request({
      url: `${BASE_URL}/wxa-dev-qbase/route/getqcloudapiauth`,
      method: 'POST',
      data: {
        action: options.identity.action,
        path: options.identity.path,
        service: options.identity.service,
        version: options.identity.version,
        region: options.identity.region,
        hashed_postdata: crypto.createHash('sha256').update(options.postdata).digest('hex'),
      },
      params: {
        appid,
        autodev: 1,
      },
      headers: {
        ...options.headers,
        'content-type': 'application/json',
        "X-CloudRunCli-Robot": "1",
        "X-CloudRunCli-Key": privateKey,
      },
    })
    const headerStr = (JSON.parse(data.data).header) as string
    // calling
    const { data: res } = await axios.request({
      url: SERVICE_CLOUD_URL[options.identity.service],
      method: 'POST',
      data: options.postdata,
      headers: headerStr
        .split('\n')
        .map((str) => str.trim())
        .reduce<Record<string, string>>((acc, cur) => {
          const ind = cur.indexOf(':')
          acc[cur.slice(0, ind)] = cur.slice(ind + 1)
          return acc
        }, {}),
    })
    const content: T = res
    if (typeof res !== 'string') {
      return JSON.stringify(res) as any
    }
    return content
  } else {
    const { data, status } = await axios.request({
      url: `${BASE_URL}/wxa-dev-qbase/apihttpagent`,
      params: {
        appid,
        autodev: 1,
      },
      method: 'post',
      data: {
        postdata: options.postdata,
        ...merge({}, options.identity, getApiCommonParameters()),
      },
      headers: {
        ...options.headers,
        'content-type': 'application/json',
        "X-CloudRunCli-Robot": "1",
        "X-CloudRunCli-Key": privateKey,
      },
    })

    if (status === 413) {
      throw new Error(`Body too large`)
    }

    if (!data) {
      throw new Error(`Empty body ${data}`)
    }

    const parsedBody = data
    if (parsedBody.errCode) {
      throw new Error(`${parsedBody.errCode} ${parsedBody.errMsg}`)
    }

    const parsedResp = parsedBody
    // tslint:disable-next-line
    if (!parsedResp || !parsedResp.base_resp || parsedResp.base_resp.ret != '0') {
      if (parsedResp.base_resp.ret === 80210) {
        throw new Error(`NO_CLOUD_MANAGE_PERMISSION_AUTHORIZED_TO_3RD_PLATFORM`)
      }
      throw new Error(`Base resp abnormal, ${JSON.stringify(parsedResp?.base_resp)}`)
    }
    const content: T = parsedResp.content
    return content
  }
}
