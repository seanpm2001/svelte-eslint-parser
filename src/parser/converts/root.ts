import type * as SvAST from "../svelte-ast-types";
import type * as Compiler from "svelte/compiler";
import type {
  SvelteName,
  SvelteProgram,
  SvelteScriptElement,
  SvelteStyleElement,
} from "../../ast";
import {} from "./common";
import type { Context } from "../../context";
import { convertChildren, extractElementTags } from "./element";
import { convertAttributes } from "./attr";
import type { Scope } from "eslint-scope";
import {
  getChildren,
  getFragmentFromRoot,
  getInstanceFromRoot,
  getModuleFromRoot,
  getOptionsFromRoot,
} from "../compat";

/**
 * Convert root
 */
export function convertSvelteRoot(
  svelteAst: Compiler.Root | SvAST.AstLegacy,
  ctx: Context,
): SvelteProgram {
  const ast: SvelteProgram = {
    type: "Program",
    body: [],
    comments: ctx.comments,
    sourceType: "module",
    tokens: ctx.tokens,
    parent: null,
    ...ctx.getConvertLocation({ start: 0, end: ctx.code.length }),
  };
  const body = ast.body;
  const fragment = getFragmentFromRoot(svelteAst);
  if (fragment) {
    let children = getChildren(fragment);
    const options = getOptionsFromRoot(svelteAst, ctx.code);
    if (options) {
      children = [...children];
      if (
        !children.some((node, idx) => {
          if (options.end <= node.start) {
            children.splice(idx, 0, options);
            return true;
          }
          return false;
        })
      ) {
        children.push(options);
      }
    }
    body.push(...convertChildren({ nodes: children }, ast, ctx));
  }
  const instance = getInstanceFromRoot(svelteAst);
  if (instance) {
    const script: SvelteScriptElement = {
      type: "SvelteScriptElement",
      name: null as any,
      startTag: null as any,
      body: [],
      endTag: null,
      parent: ast,
      ...ctx.getConvertLocation(instance),
    };
    extractAttributes(script, ctx);
    extractElementTags(script, ctx, {
      buildNameNode: (openTokenRange) => {
        ctx.addToken("HTMLIdentifier", openTokenRange);
        const name: SvelteName = {
          type: "SvelteName",
          name: "script",
          parent: script,
          ...ctx.getConvertLocation(openTokenRange),
        };
        return name;
      },
    });
    body.push(script);
  }

  const module = getModuleFromRoot(svelteAst);
  if (module) {
    const script: SvelteScriptElement = {
      type: "SvelteScriptElement",
      name: null as any,
      startTag: null as any,
      body: [],
      endTag: null,
      parent: ast,
      ...ctx.getConvertLocation(module),
    };
    extractAttributes(script, ctx);
    extractElementTags(script, ctx, {
      buildNameNode: (openTokenRange) => {
        ctx.addToken("HTMLIdentifier", openTokenRange);
        const name: SvelteName = {
          type: "SvelteName",
          name: "script",
          parent: script,
          ...ctx.getConvertLocation(openTokenRange),
        };
        return name;
      },
    });
    body.push(script);
  }
  if (svelteAst.css) {
    const style: SvelteStyleElement = {
      type: "SvelteStyleElement",
      name: null as any,
      startTag: null as any,
      children: [] as any,
      endTag: null,
      parent: ast,
      ...ctx.getConvertLocation(svelteAst.css),
    };

    extractAttributes(style, ctx);
    extractElementTags(style, ctx, {
      buildNameNode: (openTokenRange) => {
        ctx.addToken("HTMLIdentifier", openTokenRange);
        const name: SvelteName = {
          type: "SvelteName",
          name: "style",
          parent: style,
          ...ctx.getConvertLocation(openTokenRange),
        };
        return name;
      },
    });

    if (style.endTag && style.startTag.range[1] < style.endTag.range[0]) {
      const contentRange = {
        start: style.startTag.range[1],
        end: style.endTag.range[0],
      };
      ctx.addToken("HTMLText", contentRange);
      style.children = [
        {
          type: "SvelteText",
          value: ctx.code.slice(contentRange.start, contentRange.end),
          parent: style,
          ...ctx.getConvertLocation(contentRange),
        },
      ];
    }

    body.push(style);
  }

  // Set the scope of the Program node.
  ctx.scriptLet.addProgramRestore(
    (
      node,
      _tokens,
      _comments,
      { scopeManager, registerNodeToScope, addPostProcess },
    ) => {
      const scopes: Scope[] = [];
      for (const scope of scopeManager.scopes) {
        if (scope.block === node) {
          registerNodeToScope(ast, scope);
          scopes.push(scope);
        }
      }
      addPostProcess(() => {
        // Reverts the node indicated by `block` to the original Program node.
        // This state is incorrect, but `eslint-utils`'s `referenceTracker.iterateEsmReferences()` tracks import statements
        // from Program nodes set to `block` in global scope. This can only be handled by the original Program node.
        scopeManager.globalScope.block = node;
      });
    },
  );

  return ast;
}

/** Extract attrs */
function extractAttributes(
  element: SvelteScriptElement | SvelteStyleElement,
  ctx: Context,
) {
  element.startTag = {
    type: "SvelteStartTag",
    attributes: [],
    selfClosing: false,
    parent: element,
    range: [element.range[0], null as any],
    loc: {
      start: {
        line: element.loc.start.line,
        column: element.loc.start.column,
      },
      end: null as any,
    },
  };
  const block = ctx.findBlock(element);
  if (block) {
    element.startTag.attributes.push(
      ...convertAttributes(block.attrs, element.startTag, ctx),
    );
  }
}
