import type { SourceCode } from "eslint";
import { unionWith } from "eslint-visitor-keys";
import type { SvelteNode } from "./ast";

type SvelteKeysType<T extends SvelteNode = SvelteNode> = {
  [key in SvelteNode["type"]]: T extends { type: key }
    ? KeyofObject<T>[]
    : never;
};
type KeyofObject<T> = { [key in keyof T]: key }[keyof T];

const svelteKeys: SvelteKeysType = {
  Program: ["body"],
  SvelteScriptElement: ["name", "startTag", "body", "endTag"],
  SvelteStyleElement: ["name", "startTag", "children", "endTag"],
  SvelteElement: ["name", "startTag", "children", "endTag"],
  SvelteStartTag: ["attributes"],
  SvelteEndTag: [],
  SvelteName: [],
  SvelteMemberExpressionName: ["object", "property"],
  SvelteLiteral: [],
  SvelteMustacheTag: ["expression"],
  SvelteDebugTag: ["identifiers"],
  SvelteConstTag: ["declaration"],
  SvelteRenderTag: ["callee", "argument"],
  SvelteIfBlock: ["expression", "children", "else"],
  SvelteElseBlock: ["children"],
  SvelteEachBlock: [
    "expression",
    "context",
    "index",
    "key",
    "children",
    "else",
  ],
  SvelteAwaitBlock: ["expression", "pending", "then", "catch"],
  SvelteAwaitPendingBlock: ["children"],
  SvelteAwaitThenBlock: ["value", "children"],
  SvelteAwaitCatchBlock: ["error", "children"],
  SvelteKeyBlock: ["expression", "children"],
  SvelteSnippetBlock: ["id", "context", "children"],
  SvelteAttribute: ["key", "value"],
  SvelteShorthandAttribute: ["key", "value"],
  SvelteSpreadAttribute: ["argument"],
  SvelteDirective: ["key", "expression"],
  SvelteStyleDirective: ["key", "value"],
  SvelteSpecialDirective: ["key", "expression"],
  SvelteDirectiveKey: ["name"],
  SvelteSpecialDirectiveKey: [],
  SvelteText: [],
  SvelteHTMLComment: [],
  SvelteReactiveStatement: ["label", "body"],
};

export const KEYS: SourceCode.VisitorKeys = unionWith(
  svelteKeys,
) as SourceCode.VisitorKeys;
