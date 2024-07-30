import { apply, makeCreator } from '../src';
import { getProxyDraft } from '../src/utils';

const create = makeCreator({
  enablePatches: { arrayLengthAssignment: false },
});

function makeItem<T>(v: T): Record<string, unknown> {
  return { value: v };
}

describe('numeric array', () => {
  test('shift', () => {
    const base = { items: [1, 2, 3, 4, 5] };
    const [state, patches, inversePatches] = create(base, (draft) => {
      draft.items.shift();
      draft.items.shift();
    });

    expect(state).toStrictEqual({
      items: [3, 4, 5],
    });
    expect(apply(base, patches)).toStrictEqual(state);
    expect(apply(state, inversePatches)).toStrictEqual(base);
  });

  test('pop', () => {
    const base = { items: [1, 2, 3, 4, 5] };
    const [state, patches, inversePatches] = create(base, (draft) => {
      draft.items.pop();
      draft.items.pop();
    });

    expect(state).toStrictEqual({
      items: [1, 2, 3],
    });
    expect(apply(base, patches)).toStrictEqual(state);
    expect(apply(state, inversePatches)).toStrictEqual(base);
  });

  test('push', () => {
    const base = { items: [1, 2, 3, 4, 5] };
    const [state, patches, inversePatches] = create(base, (draft) => {
      draft.items.pop();
      draft.items.pop();
    });

    expect(state).toStrictEqual({
      items: [1, 2, 3],
    });
    expect(apply(base, patches)).toStrictEqual(state);
    expect(apply(state, inversePatches)).toStrictEqual(base);
  });

  test('splice', () => {
    const base = { items: [1, 2, 3, 4, 5] };
    const [state, patches, inversePatches] = create(base, (draft) => {
      draft.items.splice(0, 1, 10, 11);
      draft.items.splice(4, 1, 12, 13);
      draft.items.splice(2, 1, 14, 15);
    });
    console.dir({ base, state, patches, inversePatches }, { depth: null });

    expect(state).toStrictEqual({
      items: [10, 11, 14, 15, 3, 12, 13, 5],
    });
    expect(apply(base, patches)).toStrictEqual(state);
    expect(apply(state, inversePatches)).toStrictEqual(base);
  });
});

describe('object array', () => {
  test('shift', () => {
    const base = { items: [1, 2, 3, 4, 5].map(makeItem) };
    const [state, patches, inversePatches] = create(base, (draft) => {
      draft.items.shift();
      draft.items.shift();
    });

    expect(state).toStrictEqual({
      items: [{ value: 3 }, { value: 4 }, { value: 5 }],
    });
    expect(apply(base, patches)).toStrictEqual(state);
    expect(apply(state, inversePatches)).toStrictEqual(base);
  });

  test('pop', () => {
    const base = { items: [1, 2, 3, 4, 5].map(makeItem) };
    const [state, patches, inversePatches] = create(base, (draft) => {
      draft.items.pop();
      draft.items.pop();
    });

    expect(state).toStrictEqual({
      items: [{ value: 1 }, { value: 2 }, { value: 3 }],
    });
    expect(apply(base, patches)).toStrictEqual(state);
    expect(apply(state, inversePatches)).toStrictEqual(base);
  });

  test('push', () => {
    const base = { items: [1, 2, 3, 4, 5].map(makeItem) };
    const [state, patches, inversePatches] = create(base, (draft) => {
      draft.items.pop();
      draft.items.pop();
    });

    expect(state).toStrictEqual({
      items: [{ value: 1 }, { value: 2 }, { value: 3 }],
    });
    expect(apply(base, patches)).toStrictEqual(state);
    expect(apply(state, inversePatches)).toStrictEqual(base);
  });

  test('splice', () => {
    const base = { items: [1, 2, 3, 4, 5].map(makeItem) };
    const [state, patches, inversePatches] = create(base, (draft) => {
      draft.items.splice(0, 1, makeItem(10), makeItem(11));
      draft.items.splice(4, 1, makeItem(12), makeItem(13));
      draft.items.splice(2, 1, makeItem(14), makeItem(15));
    });
    console.dir({ base, state, patches, inversePatches }, { depth: null });

    expect(state).toStrictEqual({
      items: [
        { value: 10 },
        { value: 11 },
        { value: 14 },
        { value: 15 },
        { value: 3 },
        { value: 12 },
        { value: 13 },
        { value: 5 },
      ],
    });
    expect(apply(base, patches)).toStrictEqual(state);
    expect(apply(state, inversePatches)).toStrictEqual(base);
  });

  test('splice and propety edit', () => {
    const base = { items: [1, 2, 3].map(makeItem) };
    const [state, patches, inversePatches] = create(base, (draft) => {
      draft.items.forEach((item) => (item.added = true));
      draft.items.splice(1, 1, makeItem(10));
      draft.items.forEach((item) => (item.added2 = true));
    });

    expect(state).toStrictEqual({
      items: [
        { value: 1, added: true, added2: true },
        { value: 10, added2: true },
        { value: 3, added: true, added2: true },
      ],
    });
    expect(apply(base, patches)).toStrictEqual(state);
    expect(apply(state, inversePatches)).toStrictEqual(base);
  });

  test('complex case 1', () => {
    const base = { items: [1, 2, 3, 4, 5].map(makeItem) };
    const [state, patches, inversePatches] = create(base, (draft) => {
      draft.items[0].added0 = 21;
      draft.items[4].added1 = 22;
      draft.items.splice(3, 1, makeItem(10), makeItem(11));
      draft.items.push(makeItem(100));
      draft.items[5].added2 = 23;
    });

    expect(state).toStrictEqual({
      items: [
        { value: 1, added0: 21 },
        { value: 2 },
        { value: 3 },
        { value: 10 },
        { value: 11 },
        { value: 5, added1: 22, added2: 23 },
        { value: 100 },
      ],
    });
    expect(apply(base, patches)).toStrictEqual(state);
    expect(apply(state, inversePatches)).toStrictEqual(base);
  });

  test('shared object', () => {
    const shared = makeItem(100);
    const base = {
      items1: [makeItem(11), makeItem(12), shared],
      items2: [shared, makeItem(21)],
    };
    const [state, patches, inversePatches] = create(base, (draft) => {
      draft.items1.splice(0, 0, makeItem(13), makeItem(14));
      draft.items2.splice(0, 0, makeItem(22));
      draft.items1[4].added = true; // shared object
    });

    expect(state).toStrictEqual({
      items1: [
        { value: 13 },
        { value: 14 },
        { value: 11 },
        { value: 12 },
        { value: 100, added: true },
      ],
      items2: [{ value: 22 }, { value: 100 }, { value: 21 }],
    });
    expect(apply(base, patches)).toStrictEqual(state);
    expect(apply(state, inversePatches)).toStrictEqual(base);
  });

  test('nested array', () => {
    const base = {
      items: [
        [makeItem(11)],
        [makeItem(21), makeItem(22), makeItem(23)],
        [makeItem(31)],
      ],
    };
    const [state, patches, inversePatches] = create(base, (draft) => {
      draft.items[1].splice(1, 0, makeItem(24));
      draft.items.splice(0, 1, [makeItem(41), makeItem(42)], []);
    });

    expect(state).toStrictEqual({
      items: [
        [{ value: 41 }, { value: 42 }],
        [],
        [{ value: 21 }, { value: 24 }, { value: 22 }, { value: 23 }],
        [{ value: 31 }],
      ],
    });
    expect(apply(base, patches)).toStrictEqual(state);
    expect(apply(state, inversePatches)).toStrictEqual(base);
  });
});
