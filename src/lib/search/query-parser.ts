export type QueryAst = { type: 'term'; value: string };

export function parseQuery(input: string): QueryAst {
  return { type: 'term', value: input.trim() };
}
