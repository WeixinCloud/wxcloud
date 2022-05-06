import * as os from "os";
import * as fs from "fs";
import * as path from "path";
import { constantCase } from "change-case";
import cli from "cli-ux";
import { fetchApi } from "../api/base";
import * as dotenv from "dotenv";
import * as shortid from "shortid";
import axios from "axios";
import { execWithLoading } from "./loading";

const NodeRSA = require("node-rsa");

const HOME_DIR = os.homedir();
const WXCLOUD_CONFIG_PATH = path.resolve(HOME_DIR, ".wxcloudconfig");

const basepath =
  "https://web-test-7gz6yo8c98e82c01-1304825656.ap-shanghai.app.tcloudbase.com";

export async function openQrCodeLogin() {
  const randstr = shortid.generate();
  await cli.open(`${basepath}/cloudrun/cliAuth?randstr=${randstr}`);
  return randstr;
}

export async function waitForQrCodeLoginResult(
  randstr: string,
  timeout: number
): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        return;
      }
      try {
        const res = await axios.get(
          `${basepath}/api/wxa-dev-qbase/getcloudrunclisession?randstr=${randstr}`
        );
        if (res.data?.base_resp?.ret === 0) {
          const {
            cloudruncli_access_token: accessToken,
            cloudruncli_refresh_token: refreshToken,
          } = res.data;
          clearInterval(interval);
          resolve({
            accessToken,
            refreshToken,
          });
        }
      } catch (e) {
        clearInterval(interval);
        reject(e);
      }
    }, 2000);
  });
}

export function createSign(data: string, privateKey: string) {
  const key = new NodeRSA(privateKey, "private");
  const encrypted = key.encryptPrivate(Buffer.from(data), "base64");
  return encrypted;
}

export async function checkLoginState(appid: string, privateKey: string) {
  try {
    const data = await fetchApi(
      "wxa-dev-qbase/getqbaseinfo",
      { appid },
      { wxCloudConfig: { appid, privateKey } }
    );
    // console.log(data);
    if (data?.base_resp?.ret === 0) {
      return true;
    } else {
      return false;
    }
  } catch (e) {
    // console.log(e);
    return false;
  }
}
export async function writeLoginState(appid: string, privateKey: string) {
  await fs.promises.writeFile(
    WXCLOUD_CONFIG_PATH,
    generateDotenv({ appid, privateKey })
  );
}

export async function saveLoginState(appid: string, privateKey: string) {
  await execWithLoading(() => writeLoginState(appid, privateKey), {
    startTip: `写入配置文件中：${WXCLOUD_CONFIG_PATH}`,
    failTip: "写入配置文件失败，请重试！",
  });
}

export async function removeLoginState() {
  if (fs.existsSync(WXCLOUD_CONFIG_PATH)) {
    await fs.promises.unlink(WXCLOUD_CONFIG_PATH);
  }
}

export async function readLoginState(): Promise<{ [key: string]: string }> {
  try {
    fs.statSync(WXCLOUD_CONFIG_PATH);
  } catch (e) {
    throw new Error("您尚未登录 CLI，请先登录：wxcloud login");
  }
  const state = dotenv.parse(
    await fs.promises.readFile(WXCLOUD_CONFIG_PATH, "utf8")
  );
  const appid = state["APPID"];
  const privateKey = state["PRIVATE_KEY"];
  return {
    appid,
    privateKey,
  };
}

export function generateDotenv(obj: any) {
  const arr: any = [];
  for (const key in obj) {
    arr.push(`${constantCase(key)}=${obj[key]}`);
  }
  return arr.join("\n");
}
