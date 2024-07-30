import { DraftType, Operation, Patches, ProxyDraft } from './interface';
import {
  cloneIfNeeded,
  escapePath,
  get,
  getProxyDraft,
  has,
  isEqual,
} from './utils';
import { diffArrays } from 'diff';

function generateArrayPatches(
  proxyState: ProxyDraft<Array<any>>,
  basePath: any[],
  patches: Patches,
  inversePatches: Patches,
  pathAsArray: boolean
) {
  // return generateArrayPatchesNaively(
  return generateArrayPatchesByDiff(
    proxyState,
    basePath,
    patches,
    inversePatches,
    pathAsArray
  );
}

export type ArrayChange = {
  op: 'unchanged' | 'added' | 'removed';
  count: number;
};

type ArrayChangeWithReplace =
  | ArrayChange
  | {
      op: 'replace';
      count: number;
    };

function modifyChangesToWithReplace<T>(changes: Array<ArrayChangeWithReplace>) {
  for (let i = 0; i < changes.length - 1; i++) {
    let added: ArrayChangeWithReplace;
    let removed: ArrayChangeWithReplace;

    if (changes[i].op === 'added' && changes[i + 1].op === 'removed') {
      added = changes[i];
      removed = changes[i + 1];
    } else if (changes[i].op === 'removed' && changes[i + 1].op === 'added') {
      added = changes[i + 1];
      removed = changes[i];
    } else {
      // eslint-disable-next-line no-continue
      continue;
    }

    if (added.count < removed.count) {
      changes[i] = {
        op: 'replace' as const,
        count: added.count,
      };
      changes[i + 1] = {
        op: 'removed' as const,
        count: removed.count - added.count,
      };
    } else {
      changes[i] = {
        op: 'replace' as const,
        count: removed.count,
      };
      changes[i + 1] = {
        op: 'added' as const,
        count: added.count - removed.count,
      };
    }
  }
}

function generateArrayPatchesByDiff(
  proxyState: ProxyDraft<Array<any>>,
  basePath: any[],
  patches: Patches,
  inversePatches: Patches,
  pathAsArray: boolean
) {
  let { original } = proxyState;
  let copy = proxyState.copy!;

  const changes =
    proxyState.arrayChanges ??
    diffArrays(original, copy, {
      comparator: (a: any, b: any) =>
        (getProxyDraft(a)?.original ?? a) === (getProxyDraft(b)?.original ?? b),
    }).map((change) => ({
      op: change.added ? 'added' : change.removed ? 'removed' : 'unchanged',
      count: change.value.length,
    }));

  modifyChangesToWithReplace(changes as Array<ArrayChangeWithReplace>);

  let oldIndex = 0;
  let newIndex = 0;
  for (const change of changes) {
    if (change.op === 'added') {
      for (let i = 0; i < change.count; i += 1) {
        patches.push({
          op: Operation.Add,
          path: escapePath(basePath.concat([newIndex]), pathAsArray),
          value: cloneIfNeeded(copy[newIndex]),
        });
        inversePatches.push({
          op: Operation.Remove,
          path: escapePath(basePath.concat([newIndex]), pathAsArray),
        });
        newIndex += 1;
      }
    } else if (change.op === 'removed') {
      for (let i = 0; i < change.count; i += 1) {
        patches.push({
          op: Operation.Remove,
          path: escapePath(basePath.concat([newIndex]), pathAsArray),
        });
        inversePatches.push({
          op: Operation.Add,
          path: escapePath(basePath.concat([newIndex]), pathAsArray),
          value: cloneIfNeeded(original[oldIndex]),
        });
        oldIndex += 1;
      }
    } else if (change.op === 'unchanged') {
      for (let i = 0; i < change.count; i += 1) {
        newIndex += 1;
        oldIndex += 1;
      }
    } else if (change.op === 'replace') {
      for (let i = 0; i < change.count; i += 1) {
        patches.push({
          op: Operation.Replace,
          path: escapePath(basePath.concat([newIndex]), pathAsArray),
          value: cloneIfNeeded(copy[newIndex]),
        });
        inversePatches.push({
          op: Operation.Replace,
          path: escapePath(basePath.concat([newIndex]), pathAsArray),
          value: cloneIfNeeded(original[oldIndex]),
        });
        newIndex += 1;
        oldIndex += 1;
      }
    }
  }
}

function generateArrayPatchesNaively(
  proxyState: ProxyDraft<Array<any>>,
  basePath: any[],
  patches: Patches,
  inversePatches: Patches,
  pathAsArray: boolean
) {
  let { original, assignedMap, options } = proxyState;
  let copy = proxyState.copy!;

  if (copy.length < original.length) {
    [original, copy] = [copy, original];
    [patches, inversePatches] = [inversePatches, patches];
  }
  for (let index = 0; index < original.length; index += 1) {
    if (assignedMap!.get(index.toString()) && copy[index] !== original[index]) {
      const _path = basePath.concat([index]);
      const path = escapePath(_path, pathAsArray);
      patches.push({
        op: Operation.Replace,
        path,
        // If it is a draft, it needs to be deep cloned, and it may also be non-draft.
        value: cloneIfNeeded(copy[index]),
      });
      inversePatches.push({
        op: Operation.Replace,
        path,
        // If it is a draft, it needs to be deep cloned, and it may also be non-draft.
        value: cloneIfNeeded(original[index]),
      });
    }
  }
  for (let index = original.length; index < copy.length; index += 1) {
    const _path = basePath.concat([index]);
    const path = escapePath(_path, pathAsArray);
    patches.push({
      op: Operation.Add,
      path,
      // If it is a draft, it needs to be deep cloned, and it may also be non-draft.
      value: cloneIfNeeded(copy[index]),
    });
  }
  if (original.length < copy.length) {
    // https://www.rfc-editor.org/rfc/rfc6902#appendix-A.4
    // For performance, here we only generate an operation that replaces the length of the array,
    // which is inconsistent with JSON Patch specification
    const { arrayLengthAssignment = true } = options.enablePatches;
    if (arrayLengthAssignment) {
      const _path = basePath.concat(['length']);
      const path = escapePath(_path, pathAsArray);
      inversePatches.push({
        op: Operation.Replace,
        path,
        value: original.length,
      });
    } else {
      for (let index = copy.length; original.length < index; index -= 1) {
        const _path = basePath.concat([index - 1]);
        const path = escapePath(_path, pathAsArray);
        inversePatches.push({
          op: Operation.Remove,
          path,
        });
      }
    }
  }
}

function generatePatchesFromAssigned(
  { original, copy, assignedMap }: ProxyDraft<Record<string, any>>,
  basePath: any[],
  patches: Patches,
  inversePatches: Patches,
  pathAsArray: boolean
) {
  assignedMap!.forEach((assignedValue, key) => {
    const originalValue = get(original, key);
    const value = cloneIfNeeded(get(copy, key));
    const op = !assignedValue
      ? Operation.Remove
      : has(original, key)
      ? Operation.Replace
      : Operation.Add;
    if (isEqual(originalValue, value) && op === Operation.Replace) return;
    const _path = basePath.concat(key);
    const path = escapePath(_path, pathAsArray);
    patches.push(op === Operation.Remove ? { op, path } : { op, path, value });
    inversePatches.push(
      op === Operation.Add
        ? { op: Operation.Remove, path }
        : op === Operation.Remove
        ? { op: Operation.Add, path, value: originalValue }
        : { op: Operation.Replace, path, value: originalValue }
    );
  });
}

function generateSetPatches(
  { original, copy }: ProxyDraft<Set<any>>,
  basePath: any[],
  patches: Patches,
  inversePatches: Patches,
  pathAsArray: boolean
) {
  let index = 0;
  original.forEach((value: any) => {
    if (!copy!.has(value)) {
      const _path = basePath.concat([index]);
      const path = escapePath(_path, pathAsArray);
      patches.push({
        op: Operation.Remove,
        path,
        value,
      });
      inversePatches.push({
        op: Operation.Add,
        path,
        value,
      });
    }
    index += 1;
  });
  index = 0;
  copy!.forEach((value: any) => {
    if (!original.has(value)) {
      const _path = basePath.concat([index]);
      const path = escapePath(_path, pathAsArray);
      patches.push({
        op: Operation.Add,
        path,
        value,
      });
      inversePatches.push({
        op: Operation.Remove,
        path,
        value,
      });
    }
    index += 1;
  });
}

export function generatePatches(
  proxyState: ProxyDraft,
  basePath: any[],
  patches: Patches,
  inversePatches: Patches
) {
  const { pathAsArray = true } = proxyState.options.enablePatches;
  switch (proxyState.type) {
    case DraftType.Object:
    case DraftType.Map:
      return generatePatchesFromAssigned(
        proxyState,
        basePath,
        patches,
        inversePatches,
        pathAsArray
      );
    case DraftType.Array:
      return generateArrayPatches(
        proxyState,
        basePath,
        patches,
        inversePatches,
        pathAsArray
      );
    case DraftType.Set:
      return generateSetPatches(
        proxyState,
        basePath,
        patches,
        inversePatches,
        pathAsArray
      );
  }
}
