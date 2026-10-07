/** type-safe JSON.parse and JSON.stringify */
declare global {
  /** a string which is stringified JSON. */
  export type Stringified<T> = string & { [_: symbol]: T };

  /** undoes {@link Stringified} */
  export type UnStringified<T> = T extends Stringified<infer U> ? U : never;

  interface JSON {
    parse<T = unknown>(
      string: Stringified<T> | string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      reviver?: (this: any, key: string, value: any) => any,
    ): T;

    stringify<T = unknown>(
      value: T,
      replacer?:
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        | ((this: any, key: string, value: any) => any)
        | (number | string)[]
        | null
        | undefined,
      space?: string | number,
    ): Stringified<T>;
  }
}
