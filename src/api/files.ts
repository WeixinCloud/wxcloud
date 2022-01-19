import axios from "axios";
import cli from "cli-ux";

export async function uploadVersionPackage(url, zipFile) {
  cli.action.start("上传文件中");
  const res = await axios.put(url, zipFile, {
    headers: {
      "content-type": "application/zip",
    },
  });
  cli.action.stop();
  return res;
}
