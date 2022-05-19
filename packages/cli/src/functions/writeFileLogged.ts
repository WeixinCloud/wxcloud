import { writeFile } from 'fs/promises';
import { wrapInfo } from '../utils/colors';

export const writeFileLogged = async (fullPath: string, content: string) => {
  await writeFile(fullPath, content);
  console.log(wrapInfo(`写入 ${fullPath}`));
};
