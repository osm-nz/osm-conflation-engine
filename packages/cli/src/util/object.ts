export const hash = (str: string): string => {
  let h = 0;
  for (let index = 0; index < str.length; index += 1) {
    // eslint-disable-next-line unicorn/prefer-code-point -- TODO: review this suggestion
    const char = str.charCodeAt(index);

    h = (h << 5) - h + char;
    h &= h; // convert to 32bit integer
  }
  return new Uint32Array([h])[0]!.toString(36);
};

export const chunk = <T>(list: T[], size: number): T[][] =>
  list.reduce<T[][]>(
    (r, v) =>
      ((!r.length || r.at(-1)!.length === size
        ? r.push([v])
        : r.at(-1)!.push(v)) && r) as T[][],
    [],
  );
