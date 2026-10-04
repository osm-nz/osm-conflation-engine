/** temporary hack to import contexts from the main app */
export interface IHostContext {
  /** from LocaleContext */
  $(key: string, params?: Record<string, unknown>): string;
  /** from LocaleContext */
  $$(
    key: string,
    params?: Record<string, unknown>,
    markup?: Readonly<Record<string, React.ElementType>>,
  ): React.ReactNode;
  /** from AuthContext */
  username: string;
}
