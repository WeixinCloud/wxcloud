
import fs from 'fs'
import path from 'path'
import JSZip from 'jszip'
import minimatch from 'minimatch'

const minimatchWithList = (targetPath: string, patterns: string[]) => {
  if (!patterns) return false
  for (const pattern of patterns) {
    if (pattern.startsWith('!') && !minimatch(targetPath, pattern)) {
      return false
    }
  }
  for (const pattern of patterns) {
    if (!pattern.startsWith('!') && minimatch(targetPath, pattern)) {
      return true
    }
  }
  return false
}

interface IZipFileOptions {
  ignore?: string[]
  name?: string
  zip?: JSZip
  includeRoot?: boolean
}

export const zipFile = (
  filePath: string,
  { ignore, name, zip = new JSZip(), includeRoot = false }: IZipFileOptions = {},
) => {
  if (!fs.existsSync(filePath)) {
    return zip
  }

  const stat = fs.lstatSync(filePath)
  const basename = name || path.basename(filePath)

  if (stat.isSymbolicLink()) {
    // https://github.com/Stuk/jszip/issues/428
    // https://stackoverflow.com/questions/11775884/nodejs-file-permissions
    zip.file(basename, fs.readlinkSync(filePath), {
      /* eslint-disable-next-line */
      unixPermissions: parseInt(`120${parseInt((stat.mode & parseInt('777', 8)).toString(8), 10)}`, 8),
    })
  } else if (stat.isDirectory()) {
    includeRoot && zip.folder(basename)
    const files = fs.readdirSync(filePath)
    for (let i = 0, len = files.length; i < len; i++) {
      const file = files[i]
      const nextName = includeRoot ? path.posix.join(basename, file) : file
      if (ignore && minimatchWithList(nextName, ignore)) continue
      zipFile(path.join(filePath, file), {
        zip,
        ignore,
        name: nextName,
        includeRoot: true,
      })
    }
  } else {
    zip.file(basename, fs.readFileSync(filePath), {
      binary: true,
      unixPermissions: stat.mode,
    })
  }

  return zip
}

export const zipToBuffer = (zip: JSZip, onUpdate?: any) =>
  zip.generateAsync(
    {
      type: 'nodebuffer',
      platform: process.platform === 'darwin' ? 'UNIX' : 'DOS',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 9, // best compression
      },
    },
    onUpdate,
  )
