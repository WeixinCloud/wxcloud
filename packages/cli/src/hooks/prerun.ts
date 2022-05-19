import { Hook } from '@oclif/config';
import chalk from 'chalk';
//@ts-ignore
import pkg from '../../package.json';
const hook: Hook<'prerun'> = async function (opts) {
  console.log(chalk.gray(`Wxcloud CLI ${pkg.version}`));
};

export default hook;
