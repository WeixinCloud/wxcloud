import * as os from "os";
import * as fs from "fs";
import * as path from "path";
import { constantCase } from "change-case";
import cli from "cli-ux";
import { fetchApi, getCloudRunCliRandStr } from "../api/base";
import * as crypto from "crypto";

const NodeRSA = require("node-rsa");

const HOME_DIR = os.homedir();
const WXCLOUD_CONFIG_PATH = path.resolve(HOME_DIR, ".wxcloudconfig");

export function createSign(data: string, privateKey: string) {
  const key = new NodeRSA(privateKey, "private");
  const encrypted = key.encryptPrivate(Buffer.from(data), "base64");
  return encrypted;
}

export async function checkLoginState(appid: string, privateKey: string) {
  try {
    const data = await fetchApi("getqbaseinfo", { appid }, { wxCloudConfig: { appid, privateKey } });
    if (data?.base_resp?.ret === 0) {
      return true
    } else {
      return false
    }
  } catch(e) {
    return false
  }
}

export async function saveLoginState(appid: string, privateKey: string) {
  cli.action.start(`写入配置文件：${WXCLOUD_CONFIG_PATH}`);
  await fs.promises.writeFile(
    WXCLOUD_CONFIG_PATH,
    generateDotenv({ appid, privateKey })
  );
  cli.action.stop();
}

export function generateDotenv(obj: any) {
  const arr = [];
  for (const key in obj) {
    arr.push(`${constantCase(key)}=${obj[key]}`);
  }
  return arr.join("\n");
}
