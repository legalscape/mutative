// @ts-nocheck
'use strict';
import produce, { setAutoFreeze, setUseProxies, enableAllPlugins } from 'immer';
import lodash from 'lodash';
import { fromJS } from 'immutable';
import Seamless from 'seamless-immutable';
import deepFreeze from 'deep-freeze';
import { measure } from './measure';
import { create } from '../../src';

const { cloneDeep } = lodash;

enableAllPlugins();

console.log('\n# add-data - loading large set of data\n');

const dataSet = require('./data.json');
const baseState = {
  data: null,
};
const frozenBazeState = deepFreeze(cloneDeep(baseState));
const immutableJsBaseState = fromJS(baseState);
const seamlessBaseState = Seamless.from(baseState);

const MAX = 10000;

measure(
  'just mutate',
  () => ({ draft: cloneDeep(baseState) }),
  ({ draft }) => {
    draft.data = dataSet;
  }
);

measure(
  'just mutate, freeze',
  () => ({ draft: cloneDeep(baseState) }),
  ({ draft }) => {
    draft.data = dataSet;
    deepFreeze(draft);
  }
);

measure('handcrafted reducer (no freeze)', () => {
  const nextState = {
    ...baseState,
    data: dataSet,
  };
});

measure('handcrafted reducer (with freeze)', () => {
  const nextState = deepFreeze({
    ...baseState,
    data: dataSet,
  });
});

measure('immutableJS', () => {
  let state = immutableJsBaseState.withMutations((state) => {
    state.setIn(['data'], fromJS(dataSet));
  });
});

measure('immutableJS + toJS', () => {
  let state = immutableJsBaseState
    .withMutations((state) => {
      state.setIn(['data'], fromJS(dataSet));
    })
    .toJS();
});

measure('seamless-immutable', () => {
  seamlessBaseState.set('data', dataSet);
});

measure('seamless-immutable + asMutable', () => {
  seamlessBaseState.set('data', dataSet).asMutable({ deep: true });
});

measure('immer (proxy) - without autofreeze * ' + MAX, () => {
  setUseProxies(true);
  setAutoFreeze(false);
  for (let i = 0; i < MAX; i++)
    produce(baseState, (draft) => {
      draft.data = dataSet;
    });
});

measure('immer (proxy) - with autofreeze * ' + MAX, () => {
  setUseProxies(true);
  setAutoFreeze(true);
  for (let i = 0; i < MAX; i++)
    produce(frozenBazeState, (draft) => {
      draft.data = dataSet;
    });
});

measure('immer (es5) - without autofreeze * ' + MAX, () => {
  setUseProxies(false);
  setAutoFreeze(false);
  for (let i = 0; i < MAX; i++)
    produce(baseState, (draft) => {
      draft.data = dataSet;
    });
});

measure('immer (es5) - with autofreeze * ' + MAX, () => {
  setUseProxies(false);
  setAutoFreeze(true);
  for (let i = 0; i < MAX; i++)
    produce(frozenBazeState, (draft) => {
      draft.data = dataSet;
    });
});

measure('mutative without autofreeze * ' + MAX, () => {
  for (let i = 0; i < MAX; i++)
    create(frozenBazeState, (draft) => {
      draft.data = dataSet;
    });
});

measure('mutative with autofreeze * ' + MAX, () => {
  for (let i = 0; i < MAX; i++)
    create(frozenBazeState, (draft) => {
      draft.data = dataSet;
    }, {
      enableAutoFreeze: true,
    });
});
