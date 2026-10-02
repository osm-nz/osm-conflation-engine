/** exact copy of internal.def.ts */
export enum MatchType {
  OneToOne = 1,
  OneToMany = 2,
  ManyToOne = 3,
  ManyToMany = 4,
  /** 0:1 */
  Delete = 5,
  /** `1:unknown` there is no match, so we have guessed, and found some potential matches. */
  Guess = 6,
}
