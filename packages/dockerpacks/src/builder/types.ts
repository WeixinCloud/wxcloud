export type PromptRegistration = Record<string, boolean | string | string[]>;
export type FilterPromptRegistrationItem<R extends PromptRegistration, T, K = keyof R> = [
  R
] extends [never]
  ? string
  : K extends string
  ? R[K] extends T
    ? K
    : never
  : never;
