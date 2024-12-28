import ts from "typescript";

type Change = [
  (
    | "keyword"
    | "keyword2"
    | "type"
    | "string-literal"
    | "numeric-literal"
    | "call"
    | "bracket"
    | "comment"
  ),
  number,
  number
];

const syntaxKindMap = {
  // keyword
  [ts.SyntaxKind.ConstKeyword]: "keyword",
  [ts.SyntaxKind.FalseKeyword]: "keyword",
  [ts.SyntaxKind.InterfaceKeyword]: "keyword",
  [ts.SyntaxKind.LetKeyword]: "keyword",
  [ts.SyntaxKind.NullKeyword]: "keyword",
  [ts.SyntaxKind.OfKeyword]: "keyword",
  [ts.SyntaxKind.TrueKeyword]: "keyword",
  [ts.SyntaxKind.TypeKeyword]: "keyword",
  [ts.SyntaxKind.UndefinedKeyword]: "keyword",
  [ts.SyntaxKind.VarKeyword]: "keyword",
  // keyword2
  [ts.SyntaxKind.AsKeyword]: "keyword2",
  [ts.SyntaxKind.AwaitKeyword]: "keyword2",
  [ts.SyntaxKind.ExportKeyword]: "keyword2",
  [ts.SyntaxKind.ForKeyword]: "keyword2",
  [ts.SyntaxKind.FromKeyword]: "keyword2",
  [ts.SyntaxKind.IfKeyword]: "keyword2",
  [ts.SyntaxKind.ImportKeyword]: "keyword2",
  // string-literal
  [ts.SyntaxKind.StringLiteral]: "string-literal",
  [ts.SyntaxKind.NoSubstitutionTemplateLiteral]: "string-literal",
  // numeric-literal
  [ts.SyntaxKind.NumericLiteral]: "numeric-literal",
  // bracket
  [ts.SyntaxKind.CloseBraceToken]: "bracket",
  [ts.SyntaxKind.CloseBracketToken]: "bracket",
  [ts.SyntaxKind.CloseParenToken]: "bracket",
  [ts.SyntaxKind.OpenBraceToken]: "bracket",
  [ts.SyntaxKind.OpenBracketToken]: "bracket",
  [ts.SyntaxKind.OpenParenToken]: "bracket",
} satisfies Partial<Record<ts.SyntaxKind, Change[0]>> as Record<
  ts.SyntaxKind,
  Change[0]
>;

export const highlightTs = (source: string) => {
  const sourceFile = ts.createSourceFile(
    "snippet.ts",
    source,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.TS
  );

  const changes: Change[] = [];

  const add = (type: Change[0], node: ts.Node) => {
    const posShift = node.getLeadingTriviaWidth(sourceFile);
    changes.push([type, node.pos + posShift, node.end]);
  };

  for (const node of walkAst(
    sourceFile,
    sourceFile,
    (x): x is ts.Node => true
  )) {
    if (node.kind in syntaxKindMap) {
      add(syntaxKindMap[node.kind], node);
    }

    if (ts.isVariableDeclaration(node) && node.type) {
      add("type", node.type);
    }

    if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
      add("type", node.name);
    }
    if (ts.isTypeReferenceNode(node)) {
      add("type", node);
    }

    if (ts.isIdentifier(node) && node.text === "undefined") {
      add("keyword", node);
    }

    if (ts.isCallExpression(node)) {
      if (ts.isPropertyAccessExpression(node.expression)) {
        add("call", node.expression.name);
      } else if (ts.isIdentifier(node.expression)) {
        add("call", node.expression);
      }
    }

    if (
      [
        ts.SyntaxKind.StringKeyword,
        ts.SyntaxKind.BooleanKeyword,
        ts.SyntaxKind.NumberKeyword,
      ].includes(node.kind)
    ) {
      changes.push(["type", node.pos, node.end]);
      continue;
    }

    if (ts.isTemplateHead(node)) {
      changes.push(["string-literal", node.pos, node.end - 2]);
      changes.push(["keyword", node.end - 2, node.end]);
    }

    if (ts.isTemplateMiddle(node)) {
      changes.push(["keyword", node.pos, node.pos + 1]);
      changes.push(["string-literal", node.pos + 1, node.end - 2]);
      changes.push(["keyword", node.end - 2, node.end]);
    }

    if (ts.isTemplateTail(node)) {
      changes.push(["keyword", node.pos, node.pos + 1]);
      changes.push(["string-literal", node.pos + 1, node.end]);
    }
  }

  changes.push(...getChangesForFullComments(source));
  changes.push(...getChangesForInlineComments(source));
  changes.sort((a, b) => a[1] - b[2]);

  source = renderChanges(source, changes);

  return source;
};

export function* walkAst<T extends ts.Node>(
  n: ts.Node,
  s: ts.SourceFile,
  predicate: (n: ts.Node) => n is T,
  ignorePredicate?: (n: ts.Node) => boolean
): Generator<T> {
  if (ignorePredicate?.(n)) return;
  if (predicate(n)) yield n as T;

  const children = n
    .getChildren(s)
    .map((n) => walkAst<T>(n as T, s, predicate, ignorePredicate));

  for (const x of children) {
    yield* x as Generator<T>;
  }
}

const renderChanges = (source: string, changes: Change[]) => {
  let shift = 0;

  for (const change of changes) {
    let pos = shift + change[1];
    const end = shift + change[2];

    if (source[pos] === "\n") pos++;

    const changed = `<span class="ts-${change[0]}">${source.slice(
      pos,
      end
    )}</span>`;
    shift += changed.length - (end - pos);
    source = source.slice(0, pos) + changed + source.slice(end);
  }

  return source;
};

const COMMENT_REGEX = /\/\/.+/;

function* getChangesForFullComments(source: string): Generator<Change> {
  let str = source;
  let shift = 0;
  while (str.length) {
    const pos = str.search(COMMENT_REGEX);
    if (pos === -1) break;

    let length = str.slice(pos).indexOf("\n");
    if (length === -1) {
      length = str.length - 1;
    }

    yield ["comment", shift + pos, shift + pos + length];
    shift += pos + length;
    str = str.slice(pos + length);
  }
}

const COMMENT_START_REGEX = /\/\*/;
const COMMENT_END_REGEX = /\*\//;

function* getChangesForInlineComments(source: string): Generator<Change> {
  let str = source;
  let shift = 0;
  while (str.length) {
    const pos = str.search(COMMENT_START_REGEX);
    if (pos === -1) break;

    let end = str.search(COMMENT_END_REGEX);
    if (end === -1) {
      end = str.length - 1;
    }
    end += 2;

    yield ["comment", shift + pos, shift + end];
    shift += end;
    str = str.slice(end);
  }
}
