import axios from 'axios';

export async function uploadVersionPackage(url, zipFile) {
  return await axios.put(url, zipFile, {
    headers: {
      'content-type': 'application/zip'
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity
  });
}
