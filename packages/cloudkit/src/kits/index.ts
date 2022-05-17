import { CloudKitType } from '@wxcloud/core';
import { Kit } from '../common/kit';
import { NextKit } from './nextkit';
import { NuxtKit } from './nuxtkit';
import { RunKit } from './runkit';
import { StaticKit } from './statickit';

export const CloudKits: Record<CloudKitType, Kit[]> = {
  run: [new RunKit()],
  static: [new StaticKit()],
  universal: [new NextKit(), new NuxtKit()]
};
