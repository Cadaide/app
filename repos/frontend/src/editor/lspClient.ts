/**
 * Lightweight LSP client for Monaco that does NOT rely on
 * monaco-languageclient or @codingame/monaco-vscode-api.
 *
 * Uses raw vscode-jsonrpc over WebSocket (via vscode-ws-jsonrpc)
 * and registers Monaco providers manually.
 */

import type { Monaco } from "@monaco-editor/react";
import type { editor, languages, IDisposable } from "monaco-editor";
import {
  toSocket,
  WebSocketMessageReader,
  WebSocketMessageWriter,
} from "vscode-ws-jsonrpc";
import { createMessageConnection } from "vscode-jsonrpc/browser";
import type {
  MessageConnection,
  NotificationHandler,
} from "vscode-jsonrpc/browser";

// ── Helpers ────────────────────────────────────────────────────────────

function monacoToLspPosition(pos: { lineNumber: number; column: number }) {
  return { line: pos.lineNumber - 1, character: pos.column - 1 };
}

function lspToMonacoRange(
  range: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  },
  monaco: Monaco,
) {
  return new monaco.Range(
    range.start.line + 1,
    range.start.character + 1,
    range.end.line + 1,
    range.end.character + 1,
  );
}

function lspSeverityToMonaco(
  severity: number | undefined,
  monaco: Monaco,
): number {
  switch (severity) {
    case 1:
      return monaco.MarkerSeverity.Error;
    case 2:
      return monaco.MarkerSeverity.Warning;
    case 3:
      return monaco.MarkerSeverity.Info;
    case 4:
      return monaco.MarkerSeverity.Hint;
    default:
      return monaco.MarkerSeverity.Info;
  }
}

function lspCompletionKindToMonaco(
  kind: number | undefined,
  monaco: Monaco,
): number {
  // LSP CompletionItemKind → Monaco CompletionItemKind
  const map: Record<number, number> = {
    1: monaco.languages.CompletionItemKind.Text,
    2: monaco.languages.CompletionItemKind.Method,
    3: monaco.languages.CompletionItemKind.Function,
    4: monaco.languages.CompletionItemKind.Constructor,
    5: monaco.languages.CompletionItemKind.Field,
    6: monaco.languages.CompletionItemKind.Variable,
    7: monaco.languages.CompletionItemKind.Class,
    8: monaco.languages.CompletionItemKind.Interface,
    9: monaco.languages.CompletionItemKind.Module,
    10: monaco.languages.CompletionItemKind.Property,
    11: monaco.languages.CompletionItemKind.Unit,
    12: monaco.languages.CompletionItemKind.Value,
    13: monaco.languages.CompletionItemKind.Enum,
    14: monaco.languages.CompletionItemKind.Keyword,
    15: monaco.languages.CompletionItemKind.Snippet,
    16: monaco.languages.CompletionItemKind.Color,
    17: monaco.languages.CompletionItemKind.File,
    18: monaco.languages.CompletionItemKind.Reference,
    19: monaco.languages.CompletionItemKind.Folder,
    20: monaco.languages.CompletionItemKind.EnumMember,
    21: monaco.languages.CompletionItemKind.Constant,
    22: monaco.languages.CompletionItemKind.Struct,
    23: monaco.languages.CompletionItemKind.Event,
    24: monaco.languages.CompletionItemKind.Operator,
    25: monaco.languages.CompletionItemKind.TypeParameter,
  };
  return map[kind ?? 1] ?? monaco.languages.CompletionItemKind.Text;
}

function uriToDocUri(uri: string): string {
  return uri;
}

function markupToString(
  value: string | { kind: string; value: string } | undefined,
): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.value;
}

// ── LSP Client ─────────────────────────────────────────────────────────

export interface LspClientOptions {
  /** WebSocket URL, e.g. "ws://localhost:3001" */
  wsUrl: string;
  /** Monaco instance */
  monaco: Monaco;
  /** Language IDs this client handles */
  languageIds: string[];
  /** Workspace root URI, e.g. "file:///home/user/project" */
  rootUri: string;
}

export class LightLspClient {
  private conn: MessageConnection | null = null;
  private ws: WebSocket | null = null;
  private disposables: IDisposable[] = [];
  private documentVersions = new Map<string, number>();
  private serverCapabilities: any = null;
  private initialized = false;

  constructor(private opts: LspClientOptions) {}

  async start() {
    const ws = new WebSocket(this.opts.wsUrl);
    this.ws = ws;

    return new Promise<void>((resolve, reject) => {
      ws.onerror = (e) => reject(e);

      ws.onopen = async () => {
        const socket = toSocket(ws);
        const reader = new WebSocketMessageReader(socket);
        const writer = new WebSocketMessageWriter(socket);

        this.conn = createMessageConnection(reader, writer);

        // Handle diagnostics from server
        this.conn.onNotification(
          "textDocument/publishDiagnostics",
          (params: any) => {
            this.handleDiagnostics(params);
          },
        );

        // Silently handle other server notifications
        this.conn.onNotification("window/logMessage", () => {});
        this.conn.onNotification("window/showMessage", () => {});
        this.conn.onNotification("telemetry/event", () => {});

        this.conn.listen();

        await this.initialize();
        this.registerProviders();
        resolve();
      };
    });
  }

  private async initialize() {
    if (!this.conn) return;

    const result = await this.conn.sendRequest("initialize", {
      processId: null,
      clientInfo: { name: "Cadaide" },
      rootUri: this.opts.rootUri,
      capabilities: {
        textDocument: {
          synchronization: {
            dynamicRegistration: false,
            willSave: false,
            willSaveWaitUntil: false,
            didSave: true,
          },
          completion: {
            dynamicRegistration: false,
            completionItem: {
              snippetSupport: true,
              commitCharactersSupport: true,
              documentationFormat: ["markdown", "plaintext"],
              deprecatedSupport: true,
              preselectSupport: true,
              insertReplaceSupport: true,
              resolveSupport: {
                properties: ["documentation", "detail", "additionalTextEdits"],
              },
            },
            contextSupport: true,
          },
          hover: {
            dynamicRegistration: false,
            contentFormat: ["markdown", "plaintext"],
          },
          signatureHelp: {
            dynamicRegistration: false,
            signatureInformation: {
              documentationFormat: ["markdown", "plaintext"],
              parameterInformation: { labelOffsetSupport: true },
            },
          },
          definition: { dynamicRegistration: false },
          references: { dynamicRegistration: false },
          documentHighlight: { dynamicRegistration: false },
          documentSymbol: { dynamicRegistration: false },
          codeAction: { dynamicRegistration: false },
          rename: { dynamicRegistration: false, prepareSupport: true },
          publishDiagnostics: {
            relatedInformation: true,
            tagSupport: { valueSet: [1, 2] },
          },
        },
        workspace: {
          didChangeConfiguration: { dynamicRegistration: false },
        },
      },
    });

    this.serverCapabilities = (result as any).capabilities;
    this.initialized = true;

    // Send initialized notification
    this.conn.sendNotification("initialized", {});
  }

  // ── Document sync ──────────────────────────────────────────────────

  sendDidOpen(uri: string, languageId: string, text: string) {
    if (!this.conn || !this.initialized) return;

    this.documentVersions.set(uri, 1);
    this.conn.sendNotification("textDocument/didOpen", {
      textDocument: {
        uri,
        languageId,
        version: 1,
        text,
      },
    });
  }

  sendDidChange(uri: string, text: string) {
    if (!this.conn || !this.initialized) return;

    const version = (this.documentVersions.get(uri) ?? 0) + 1;
    this.documentVersions.set(uri, version);

    this.conn.sendNotification("textDocument/didChange", {
      textDocument: { uri, version },
      contentChanges: [{ text }],
    });
  }

  sendDidClose(uri: string) {
    if (!this.conn || !this.initialized) return;

    this.documentVersions.delete(uri);
    this.conn.sendNotification("textDocument/didClose", {
      textDocument: { uri },
    });
  }

  sendDidSave(uri: string, text: string) {
    if (!this.conn || !this.initialized) return;

    this.conn.sendNotification("textDocument/didSave", {
      textDocument: { uri },
      text,
    });
  }

  // ── Diagnostics ────────────────────────────────────────────────────

  private handleDiagnostics(params: { uri: string; diagnostics: any[] }) {
    const { monaco } = this.opts;
    const uri = monaco.Uri.parse(params.uri);
    const model = monaco.editor.getModel(uri);
    if (!model) return;

    const markers = params.diagnostics.map((d: any) => ({
      severity: lspSeverityToMonaco(d.severity, monaco),
      message: d.message,
      startLineNumber: d.range.start.line + 1,
      startColumn: d.range.start.character + 1,
      endLineNumber: d.range.end.line + 1,
      endColumn: d.range.end.character + 1,
      source: d.source ?? "lsp",
      code: d.code?.toString(),
    }));

    monaco.editor.setModelMarkers(model, "lsp", markers);
  }

  // ── Monaco provider registration ──────────────────────────────────

  private registerProviders() {
    const { monaco } = this.opts;

    for (const langId of this.opts.languageIds) {
      // Completion
      this.disposables.push(
        monaco.languages.registerCompletionItemProvider(langId, {
          triggerCharacters: ["."],
          provideCompletionItems: async (model: any, position: any) => {
            return this.provideCompletion(model, position);
          },
        }),
      );

      // Hover
      this.disposables.push(
        monaco.languages.registerHoverProvider(langId, {
          provideHover: async (model: any, position: any) => {
            return this.provideHover(model, position);
          },
        }),
      );

      // Signature help
      this.disposables.push(
        monaco.languages.registerSignatureHelpProvider(langId, {
          signatureHelpTriggerCharacters: ["(", ","],
          provideSignatureHelp: async (model: any, position: any) => {
            return this.provideSignatureHelp(model, position);
          },
        }),
      );

      // Go to definition
      this.disposables.push(
        monaco.languages.registerDefinitionProvider(langId, {
          provideDefinition: async (model: any, position: any) => {
            return this.provideDefinition(model, position);
          },
        }),
      );

      // References
      this.disposables.push(
        monaco.languages.registerReferenceProvider(langId, {
          provideReferences: async (
            model: any,
            position: any,
            context: any,
          ) => {
            return this.provideReferences(model, position, context);
          },
        }),
      );

      // Document highlights
      this.disposables.push(
        monaco.languages.registerDocumentHighlightProvider(langId, {
          provideDocumentHighlights: async (model: any, position: any) => {
            return this.provideDocumentHighlights(model, position);
          },
        }),
      );

      // Rename
      this.disposables.push(
        monaco.languages.registerRenameProvider(langId, {
          provideRenameEdits: async (
            model: any,
            position: any,
            newName: any,
          ) => {
            return this.provideRenameEdits(model, position, newName);
          },
          resolveRenameLocation: async (model: any, position: any) => {
            return this.resolveRenameLocation(model, position);
          },
        }),
      );

      // Document symbols
      this.disposables.push(
        monaco.languages.registerDocumentSymbolProvider(langId, {
          provideDocumentSymbols: async (model: any) => {
            return this.provideDocumentSymbols(model);
          },
        }),
      );

      // Code actions
      this.disposables.push(
        monaco.languages.registerCodeActionProvider(langId, {
          provideCodeActions: async (model: any, range: any, context: any) => {
            return this.provideCodeActions(model, range, context);
          },
        }),
      );
    }
  }

  // ── Provider implementations ───────────────────────────────────────

  private async provideCompletion(
    model: editor.ITextModel,
    position: { lineNumber: number; column: number },
  ): Promise<languages.CompletionList | undefined> {
    if (!this.conn) return undefined;

    try {
      const result = await this.conn.sendRequest("textDocument/completion", {
        textDocument: { uri: model.uri.toString() },
        position: monacoToLspPosition(position),
      });
      if (!result) return undefined;

      const items = Array.isArray(result)
        ? result
        : ((result as any).items ?? []);
      const { monaco } = this.opts;
      const word = model.getWordUntilPosition(position);

      return {
        suggestions: items.map((item: any) => {
          const insertText = item.insertText ?? item.label;
          const isSnippet = item.insertTextFormat === 2;

          return {
            label: item.label,
            kind: lspCompletionKindToMonaco(item.kind, monaco),
            insertText,
            insertTextRules: isSnippet
              ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
              : undefined,
            detail: item.detail,
            documentation: item.documentation
              ? {
                  value: markupToString(item.documentation),
                  isTrusted: true,
                }
              : undefined,
            sortText: item.sortText,
            filterText: item.filterText,
            preselect: item.preselect,
            range: {
              startLineNumber: position.lineNumber,
              startColumn: word.startColumn,
              endLineNumber: position.lineNumber,
              endColumn: word.endColumn,
            },
          };
        }),
      };
    } catch (e) {
      console.error("[LSP] completion error:", e);
      return undefined;
    }
  }

  private async provideHover(
    model: editor.ITextModel,
    position: { lineNumber: number; column: number },
  ): Promise<languages.Hover | undefined> {
    if (!this.conn) return undefined;

    try {
      const result = await this.conn.sendRequest("textDocument/hover", {
        textDocument: { uri: model.uri.toString() },
        position: monacoToLspPosition(position),
      });
      if (!result) return undefined;

      const { monaco } = this.opts;
      const contents = Array.isArray((result as any).contents)
        ? (result as any).contents
        : [(result as any).contents];

      return {
        contents: contents.map((c: any) => ({
          value: typeof c === "string" ? c : (c.value ?? ""),
          isTrusted: true,
        })),
        range: (result as any).range
          ? lspToMonacoRange((result as any).range, monaco)
          : undefined,
      };
    } catch (e) {
      console.error("[LSP] hover error:", e);
      return undefined;
    }
  }

  private async provideSignatureHelp(
    model: editor.ITextModel,
    position: { lineNumber: number; column: number },
  ): Promise<languages.SignatureHelpResult | undefined> {
    if (!this.conn) return undefined;

    try {
      const result = await this.conn.sendRequest("textDocument/signatureHelp", {
        textDocument: { uri: model.uri.toString() },
        position: monacoToLspPosition(position),
      });
      if (!result) return undefined;

      return {
        value: {
          signatures: (result as any).signatures.map((sig: any) => ({
            label: sig.label,
            documentation: sig.documentation
              ? { value: markupToString(sig.documentation) }
              : undefined,
            parameters: (sig.parameters ?? []).map((p: any) => ({
              label: p.label,
              documentation: p.documentation
                ? { value: markupToString(p.documentation) }
                : undefined,
            })),
          })),
          activeSignature: (result as any).activeSignature ?? 0,
          activeParameter: (result as any).activeParameter ?? 0,
        },
        dispose() {},
      };
    } catch (e) {
      console.error("[LSP] signatureHelp error:", e);
      return undefined;
    }
  }

  private async provideDefinition(
    model: editor.ITextModel,
    position: { lineNumber: number; column: number },
  ): Promise<languages.Definition | undefined> {
    if (!this.conn) return undefined;

    try {
      const result = await this.conn.sendRequest("textDocument/definition", {
        textDocument: { uri: model.uri.toString() },
        position: monacoToLspPosition(position),
      });
      if (!result) return undefined;

      const { monaco } = this.opts;
      const locations = Array.isArray(result) ? result : [result];

      return locations.map((loc: any) => ({
        uri: monaco.Uri.parse(loc.uri),
        range: lspToMonacoRange(loc.range, monaco),
      }));
    } catch (e) {
      console.error("[LSP] definition error:", e);
      return undefined;
    }
  }

  private async provideReferences(
    model: editor.ITextModel,
    position: { lineNumber: number; column: number },
    context: languages.ReferenceContext,
  ): Promise<languages.Location[] | undefined> {
    if (!this.conn) return undefined;

    try {
      const result = await this.conn.sendRequest("textDocument/references", {
        textDocument: { uri: model.uri.toString() },
        position: monacoToLspPosition(position),
        context: { includeDeclaration: context.includeDeclaration },
      });
      if (!result) return undefined;

      const { monaco } = this.opts;
      return (result as any).map((loc: any) => ({
        uri: monaco.Uri.parse(loc.uri),
        range: lspToMonacoRange(loc.range, monaco),
      }));
    } catch (e) {
      console.error("[LSP] references error:", e);
      return undefined;
    }
  }

  private async provideDocumentHighlights(
    model: editor.ITextModel,
    position: { lineNumber: number; column: number },
  ): Promise<languages.DocumentHighlight[] | undefined> {
    if (!this.conn) return undefined;

    try {
      const result = await this.conn.sendRequest(
        "textDocument/documentHighlight",
        {
          textDocument: { uri: model.uri.toString() },
          position: monacoToLspPosition(position),
        },
      );
      if (!result) return undefined;

      const { monaco } = this.opts;
      return (result as any).map((h: any) => ({
        range: lspToMonacoRange(h.range, monaco),
        kind: h.kind,
      }));
    } catch (e) {
      console.error("[LSP] documentHighlight error:", e);
      return undefined;
    }
  }

  private async provideRenameEdits(
    model: editor.ITextModel,
    position: { lineNumber: number; column: number },
    newName: string,
  ): Promise<languages.WorkspaceEdit | undefined> {
    if (!this.conn) return undefined;

    try {
      const result = (await this.conn.sendRequest("textDocument/rename", {
        textDocument: { uri: model.uri.toString() },
        position: monacoToLspPosition(position),
        newName,
      })) as any;
      if (!result) return undefined;

      const { monaco } = this.opts;
      const edits: languages.IWorkspaceTextEdit[] = [];

      if (result.changes) {
        for (const [uri, changes] of Object.entries(result.changes)) {
          for (const change of changes as any[]) {
            edits.push({
              resource: monaco.Uri.parse(uri),
              textEdit: {
                range: lspToMonacoRange(change.range, monaco),
                text: change.newText,
              },
              versionId: undefined,
            });
          }
        }
      }

      return { edits };
    } catch (e) {
      console.error("[LSP] rename error:", e);
      return undefined;
    }
  }

  private async resolveRenameLocation(
    model: editor.ITextModel,
    position: { lineNumber: number; column: number },
  ): Promise<languages.RenameLocation | undefined> {
    if (!this.conn) return undefined;

    try {
      const result = (await this.conn.sendRequest(
        "textDocument/prepareRename",
        {
          textDocument: { uri: model.uri.toString() },
          position: monacoToLspPosition(position),
        },
      )) as any;
      if (!result) return undefined;

      const { monaco } = this.opts;

      // Result can be { range, placeholder } or just a range
      if (result.range) {
        return {
          range: lspToMonacoRange(result.range, monaco),
          text:
            result.placeholder ?? model.getWordAtPosition(position)?.word ?? "",
        };
      }

      // Plain range
      return {
        range: lspToMonacoRange(result, monaco),
        text: model.getWordAtPosition(position)?.word ?? "",
      };
    } catch (e) {
      // prepareRename not supported or error - that's fine
      return undefined;
    }
  }

  private async provideDocumentSymbols(
    model: editor.ITextModel,
  ): Promise<languages.DocumentSymbol[] | undefined> {
    if (!this.conn) return undefined;

    try {
      const result = await this.conn.sendRequest(
        "textDocument/documentSymbol",
        {
          textDocument: { uri: model.uri.toString() },
        },
      );
      if (!result || !Array.isArray(result) || result.length === 0)
        return undefined;

      const { monaco } = this.opts;

      // Detect format: DocumentSymbol has `range`+`selectionRange`,
      // SymbolInformation has `location` with `uri`+`range`.
      const isDocumentSymbol = result[0].range && result[0].selectionRange;

      if (isDocumentSymbol) {
        const mapSymbol = (sym: any): languages.DocumentSymbol => ({
          name: sym.name,
          detail: sym.detail ?? "",
          kind: sym.kind as languages.SymbolKind,
          tags: sym.tags ?? [],
          range: lspToMonacoRange(sym.range, monaco),
          selectionRange: lspToMonacoRange(sym.selectionRange, monaco),
          children: sym.children?.map(mapSymbol),
        });
        return result.map(mapSymbol);
      }

      // SymbolInformation[] (flat list) → convert to DocumentSymbol[]
      return result.map((sym: any) => {
        const range = lspToMonacoRange(sym.location.range, monaco);
        return {
          name: sym.name,
          detail: "",
          kind: sym.kind as languages.SymbolKind,
          tags: sym.tags ?? [],
          range,
          selectionRange: range,
        };
      });
    } catch (e) {
      console.error("[LSP] documentSymbol error:", e);
      return undefined;
    }
  }

  private async provideCodeActions(
    model: editor.ITextModel,
    range: any,
    context: languages.CodeActionContext,
  ): Promise<languages.CodeActionList | undefined> {
    if (!this.conn) return undefined;

    try {
      const lspRange = {
        start: monacoToLspPosition({
          lineNumber: range.startLineNumber,
          column: range.startColumn,
        }),
        end: monacoToLspPosition({
          lineNumber: range.endLineNumber,
          column: range.endColumn,
        }),
      };

      const result = await this.conn.sendRequest("textDocument/codeAction", {
        textDocument: { uri: model.uri.toString() },
        range: lspRange,
        context: {
          diagnostics: context.markers.map((m) => ({
            range: {
              start: {
                line: m.startLineNumber - 1,
                character: m.startColumn - 1,
              },
              end: { line: m.endLineNumber - 1, character: m.endColumn - 1 },
            },
            severity: m.severity,
            message: m.message,
            source: m.source,
            code: m.code,
          })),
        },
      });
      if (!result) return { actions: [], dispose() {} };

      const { monaco } = this.opts;

      const actions: languages.CodeAction[] = (result as any).map(
        (action: any) => {
          const edits: languages.IWorkspaceTextEdit[] = [];

          if (action.edit?.changes) {
            for (const [uri, changes] of Object.entries(action.edit.changes)) {
              for (const change of changes as any[]) {
                edits.push({
                  resource: monaco.Uri.parse(uri),
                  textEdit: {
                    range: lspToMonacoRange(change.range, monaco),
                    text: change.newText,
                  },
                  versionId: undefined,
                });
              }
            }
          }

          return {
            title: action.title,
            kind: action.kind,
            diagnostics: action.diagnostics,
            isPreferred: action.isPreferred,
            edit: edits.length > 0 ? { edits } : undefined,
          };
        },
      );

      return { actions, dispose() {} };
    } catch (e) {
      console.error("[LSP] codeAction error:", e);
      return { actions: [], dispose() {} };
    }
  }

  // ── Lifecycle ──────────────────────────────────────────────────────

  stop() {
    for (const d of this.disposables) d.dispose();
    this.disposables = [];

    if (this.conn) {
      try {
        this.conn.sendRequest("shutdown").then(() => {
          this.conn?.sendNotification("exit");
          this.conn?.dispose();
        });
      } catch {
        this.conn.dispose();
      }
      this.conn = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.initialized = false;
    this.documentVersions.clear();
  }
}
