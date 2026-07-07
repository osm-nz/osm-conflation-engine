export const chunk = <T>(list: T[], size: number): T[][] =>
  list.reduce<T[][]>(
    (r, v) =>
      ((!r.length || r.at(-1)!.length === size
        ? r.push([v])
        : r.at(-1)!.push(v)) && r) as T[][],
    [],
  );
