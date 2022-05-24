import { CloudKitType } from '@wxcloud/core';
import { Kit } from '../common/kit';
import { NextKit } from './nextkit';
import { Nuxt2Kit } from './nuxt2kit';
import { Nuxt3Kit } from './nuxt3kit';
import { RunKit } from './runkit';
import { StaticKit } from './statickit';

export const CloudKits: Record<Exclude<CloudKitType, 'custom'>, Kit[]> = {
  run: [new RunKit()],
  static: [new StaticKit()],
  universal: [new NextKit(), new Nuxt2Kit(), new Nuxt3Kit()]
};
