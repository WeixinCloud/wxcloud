import * as fs from 'fs';
import archiver from 'archiver';

export async function zipDir(src: string, dest: string, ignore?: string[]) {
  return new Promise<void>((resolve, reject) => {
    // create a file to stream archive data to.
    const output = fs.createWriteStream(dest);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Sets the compression level.
    });
    output.on('close', () => {
      resolve();
    });
    archive.on('error', reject);
    archive.glob(
      '**/*',
      {
        cwd: src,
        ignore: ignore || [],
        dot: true
      },
      {}
    );
    archive.pipe(output);
    archive.finalize();
  });
}
