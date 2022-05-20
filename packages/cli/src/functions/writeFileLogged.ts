import { wrapInfo } from '../utils/colors';
import { safeWriteFile } from '../utils/file';

export const writeFileLogged = async (fullPath: string, content: string) => {
  await safeWriteFile(fullPath, content);
  console.log(wrapInfo(`写入 ${fullPath}`));
};
