export function flatten(groups, keys) {
  for (let i = 1, n = keys.length; i < n; ++i) {
    groups = groups.flatMap(g => g.pop().map(([
      key,
      value,
    ]) => [
      ...g,
      key,
      value,
    ]))
  }

  return groups
}
