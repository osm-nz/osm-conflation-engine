export const isTruthy = <T>(x: T | '' | 0 | 0n | undefined | null): x is T =>
  !!x;

export function toggle<T>(set: ReadonlySet<T>, item: T) {
  const newSet = new Set(set);
  if (!newSet.delete(item)) newSet.add(item);
  return newSet;
}
