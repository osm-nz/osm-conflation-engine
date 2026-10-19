// this file cannot have any inputs or outputs
declare module '*.sql' {
  const content: string;
  export default content;
}
