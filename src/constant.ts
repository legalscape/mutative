// Don't use `Symbol()` just for 3rd party access the draft
export const PROXY_DRAFT = Symbol.for('__MUTATIVE_PROXY_DRAFT__');

export const iteratorSymbol: typeof Symbol.iterator = Symbol.iterator;

export const dataTypes = {
  mutable: 'mutable',
  immutable: 'immutable',
} as const;
