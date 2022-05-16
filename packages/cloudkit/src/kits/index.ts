import { CloudKitType } from '@wxcloud/core';
import { Kit } from '../common/kit';
import { NextKit } from './nextkit';
import { NuxtKit } from './nuxtkit';
import { RunKit } from './runkit';

export const CloudKits: Record<CloudKitType, Kit[]> = {
  run: [new RunKit()],
  static: [],
  universal: [new NextKit(), new NuxtKit()]
};
