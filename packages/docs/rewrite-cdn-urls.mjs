import glob from 'fast-glob';
import { load } from 'cheerio';
import { readFile, writeFile } from 'fs/promises';

if (!process.argv[2]) {
  throw '参数不够';
}

const cdnUrl = process.argv[2];
const htmlFiles = glob.sync('./docs/.vuepress/dist/**/*.html');
const resourcesRegex = /\.(css|js|jpg|jpeg|png|webp|svg)$/i;
const shouldRewritePath = path => path.startsWith('/') && resourcesRegex.test(path);
const rewritePath = path => {
  const url = new URL(path, cdnUrl);
  return url.toString();
};

async function handleHtmlFile(file) {
  console.log(`处理 ${file}`);
  const content = await readFile(file);
  const $ = load(content);
  $('link[href],script[src],img[src],video[src]').each((_, e) => {
    const element = $(e);
    const href = element.attr('href');
    const src = element.attr('src');
    switch (true) {
      case href && shouldRewritePath(href):
        element.attr('href', rewritePath(href));
        break;
      case src && shouldRewritePath(src):
        element.attr('src', rewritePath(src));
        break;
    }
  });
  await writeFile(file, $.html());
}

console.log(`准备魔改产物 html 中的资源路径为 CDN url：${cdnUrl}`);

Promise.all(htmlFiles.map(file => handleHtmlFile(file))).catch(err => {
  console.error(err);
  process.exit(1);
});
