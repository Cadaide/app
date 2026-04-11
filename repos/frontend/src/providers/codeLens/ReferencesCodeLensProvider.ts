import { Editor } from "@/classes/Editor";
import { EditorHook, EditorHookId } from "@/classes/EditorHook";
import { LspSymbolKind } from "@/types/editor/lsp/Symbol";
import { Monaco } from "@monaco-editor/react";
import { editor } from "monaco-editor";

export class ReferencesCodeLensProvider {
  static #SUPPORTED_LANGUAGES = ["python", "typescript"];
  static #SUPPORTED_SYMBOL_KINDS = [5, 6, 9, 11, 12];

  static #registered: boolean = false;

  static register(monaco: Monaco, _editor: editor.IStandaloneCodeEditor) {
    if (this.#registered) return;

    this.#registered = true;

    for (const lang of this.#SUPPORTED_LANGUAGES) {
      const provider = new ReferencesCodeLensProvider();

      monaco.languages.registerCodeLensProvider(lang, {
        onDidChange: provider.#onDidChange.bind(provider),
        provideCodeLenses: provider.#provideCodeLenses.bind(provider),
        resolveCodeLens: provider.#resolveCodeLens.bind(provider),
      });
    }
  }

  #hook: EditorHook | null = null;

  #onDidChange(cb: () => void) {
    if (this.#hook) Editor.instance.disposeHook(this.#hook);

    this.#hook = new EditorHook(EditorHookId.ModelChange, cb);
    Editor.instance.registerHook(this.#hook);

    return {
      dispose: () => {
        if (this.#hook) {
          Editor.instance.disposeHook(this.#hook);

          this.#hook = null;
        }
      },
    };
  }

  async #provideCodeLenses(model: editor.ITextModel) {
    const symbols = await Editor.instance.lsp.getDocumentSymbols(
      model.uri,
      model.getLanguageId(),
    );

    const lenses = this.#flattenSymbols(symbols)
      .filter((s) =>
        ReferencesCodeLensProvider.#SUPPORTED_SYMBOL_KINDS.includes(s.kind),
      )
      .map((symbol) => ({
        range: {
          startLineNumber: symbol.range.start.line + 1,
          startColumn: symbol.range.start.character + 1,
          endLineNumber: symbol.range.end.line + 1,
          endColumn: symbol.range.end.character + 1,
        },
        id: "cadaide.refs",
        command: undefined,
        _symbolPos: {
          line: symbol.selectionRange.start.line,
          character: Math.floor(
            (symbol.selectionRange.start.character +
              symbol.selectionRange.end.character) /
              2,
          ), // center of the symbol
        },
      }));

    return { lenses, dispose: () => {} };
  }

  async #resolveCodeLens(model: editor.ITextModel, codeLens: any) {
    const pos = codeLens._symbolPos ?? {
      line: codeLens.range.startLineNumber - 1,
      character: codeLens.range.startColumn - 1,
    };

    const refs = await Editor.instance.lsp.findReferences(
      model.uri,
      pos,
      model.getLanguageId(),
    );

    const count = refs?.length ?? 0;

    return {
      ...codeLens,
      command: {
        id: "cadaide.showReferences",
        title: `${count} references`,
        arguments: [model.uri, pos],
      },
    };
  }

  #flattenSymbols(symbols: any[]): any[] {
    return symbols.flatMap((s: any) => [
      s,
      ...this.#flattenSymbols(s.children ?? []),
    ]);
  }
}
