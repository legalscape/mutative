import produce, {
  setAutoFreeze,
  setUseProxies,
  produceWithPatches,
  enablePatches,
} from 'immer';
import { create } from '../../src';
import { measure } from './measure';

const MAX = 1000;

const baseState: { arr: any[]; map: Record<string, any> } = {
  arr: [],
  map: {},
};

const createTestObject = () => ({ a: 1, b: 'b' });

baseState.arr = Array(10 ** 4)
  .fill('')
  .map(() => createTestObject());

Array(10 ** 3)
  .fill(1)
  .forEach((_, i) => {
    baseState.map[i] = { i };
  });

measure(
  'native handcrafted',
  () => baseState,
  (baseState: any) => {
    for (let i = 0; i < MAX; i++) {
      const state = {
        ...baseState,
        arr: [...baseState.arr, i],
        map: { ...baseState.map, [i]: { i } },
      };
    }
  }
);

measure(
  'mutative - without autoFreeze',
  () => baseState,
  (baseState: any) => {
    for (let i = 0; i < MAX; i++) {
      const state = create(baseState, (draft) => {
        draft.arr.push(i);
        draft.map[i] = i;
      });
    }
  }
);

measure(
  'immer - without autoFreeze',
  () => {
    setAutoFreeze(false);
    setUseProxies(true);
    return baseState;
  },
  (baseState: any) => {
    for (let i = 0; i < MAX; i++) {
      const state = produce(baseState, (draft: any) => {
        draft.arr.push(i);
        draft.map[i] = i;
      });
    }
  }
);

console.log('');

measure(
  'mutative - with autoFreeze',
  () => baseState,
  (baseState: any) => {
    for (let i = 0; i < MAX; i++) {
      const state = create(
        baseState,
        (draft) => {
          draft.arr.push(i);
          draft.map[i] = i;
        },
        {
          enableAutoFreeze: true,
        }
      );
    }
  }
);

measure(
  'immer - with autoFreeze',
  () => {
    setAutoFreeze(true);
    setUseProxies(true);
    return baseState;
  },
  (baseState: any) => {
    for (let i = 0; i < MAX; i++) {
      const state = produce(baseState, (draft: any) => {
        draft.arr.push(i);
        draft.map[i] = i;
      });
    }
  }
);

console.log('');

measure(
  'mutative - with autoFreeze and patches',
  () => baseState,
  (baseState: any) => {
    for (let i = 0; i < MAX; i++) {
      const state = create(
        baseState,
        (draft) => {
          draft.arr.push(i);
          draft.map[i] = i;
        },
        {
          enableAutoFreeze: true,
          enablePatches: true,
        }
      );
    }
  }
);

measure(
  'immer - with autoFreeze and patches',
  () => {
    setAutoFreeze(true);
    setUseProxies(true);
    enablePatches();
    return baseState;
  },
  (baseState: any) => {
    for (let i = 0; i < MAX; i++) {
      const state = produceWithPatches(baseState, (draft: any) => {
        draft.arr.push(i);
        draft.map[i] = i;
      });
    }
  }
);

console.log('-------');

measure(
  'mutative - single without autoFreeze',
  () => baseState,
  (baseState: any) => {
    const state = create(baseState, (draft) => {
      for (let i = 0; i < MAX; i++) {
        draft.arr.push(i);
        draft.map[i] = i;
      }
    });
  }
);

measure(
  'immer - single without autoFreeze',
  () => {
    setAutoFreeze(false);
    setUseProxies(true);
    return baseState;
  },
  (baseState: any) => {
    const state = produce(baseState, (draft: any) => {
      for (let i = 0; i < MAX; i++) {
        draft.arr.push(i);
        draft.map[i] = i;
      }
    });
  }
);

console.log('');

measure(
  'mutative - single - with autoFreeze',
  () => baseState,
  (baseState: any) => {
    const state = create(
      baseState,
      (draft) => {
        for (let i = 0; i < MAX; i++) {
          draft.arr.push(i);
          draft.map[i] = i;
        }
      },
      {
        enableAutoFreeze: true,
      }
    );
  }
);

measure(
  'immer - single - with autoFreeze',
  () => {
    setAutoFreeze(true);
    setUseProxies(true);
    return baseState;
  },
  (baseState: any) => {
    const state = produce(baseState, (draft: any) => {
      for (let i = 0; i < MAX; i++) {
        draft.arr.push(i);
        draft.map[i] = i;
      }
    });
  }
);

console.log('');

measure(
  'mutative - single - with enablePatches',
  () => baseState,
  (baseState: any) => {
    const state = create(
      baseState,
      (draft) => {
        for (let i = 0; i < MAX; i++) {
          draft.arr.push(i);
          draft.map[i] = i;
        }
      },
      {
        enablePatches: true,
      }
    );
  }
);

measure(
  'immer - single - with enablePatches',
  () => {
    setAutoFreeze(false);
    setUseProxies(true);
    return baseState;
  },
  (baseState: any) => {
    const state = produceWithPatches(baseState, (draft: any) => {
      for (let i = 0; i < MAX; i++) {
        draft.arr.push(i);
        draft.map[i] = i;
      }
    });
  }
);

console.log('');

measure(
  'mutative - single - with autoFreeze and patches',
  () => baseState,
  (baseState: any) => {
    const state = create(
      baseState,
      (draft) => {
        for (let i = 0; i < MAX; i++) {
          draft.arr.push(i);
          draft.map[i] = i;
        }
      },
      {
        enableAutoFreeze: true,
        enablePatches: true,
      }
    );
  }
);

measure(
  'immer - single - with autoFreeze and patches',
  () => {
    setAutoFreeze(true);
    setUseProxies(true);
    enablePatches();
    return baseState;
  },
  (baseState: any) => {
    const state = produceWithPatches(baseState, (draft: any) => {
      for (let i = 0; i < MAX; i++) {
        draft.arr.push(i);
        draft.map[i] = i;
      }
    });
  }
);
