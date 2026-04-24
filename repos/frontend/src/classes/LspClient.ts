import type { Monaco } from "@monaco-editor/react";
import type { editor, IDisposable, languages } from "monaco-editor";
import {
  createMessageConnection,
  type MessageConnection,
} from "vscode-languageclient";
import {
  toSocket,
  WebSocketMessageReader,
  WebSocketMessageWriter,
} from "vscode-ws-jsonrpc";
import * as monaco from "monaco-editor";

interface ILspClientMonacoPosition {
  lineNumber: number;
  column: number;
}

interface ILspClientLspPosition {
  line: number;
  character: number;
}

interface ILspClientLspRange {
  start: ILspClientLspPosition;
  end: ILspClientLspPosition;
}

interface ILspClientOptions {
  wsUrl: string;
  monaco: Monaco;
  languageIds: string[];
  rootUri: string;
}

export class LspClient {
  #connection: MessageConnection | null = null;
  #websocket: WebSocket | null = null;
  #disposables: IDisposable[] = [];
  #documentVersions = new Map<string, number>();
  #initialized: boolean = false;
  #options: ILspClientOptions;

  constructor(options: ILspClientOptions) {
    this.#options = options;
  }

  #monacoToLspPosition(
    position: ILspClientMonacoPosition,
  ): ILspClientLspPosition {
    return {
      line: position.lineNumber - 1,
      character: position.column - 1,
    };
  }

  #lspToMonacoRange(range: ILspClientLspRange, monaco: Monaco) {
    return new monaco.Range(
      range.start.line + 1,
      range.start.character + 1,
      range.end.line + 1,
      range.end.character + 1,
    );
  }

  #lspSeverityToMonaco(severity: number | undefined, monaco: Monaco) {
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

  #lspCompletionItemKindToMonaco(kind: number | undefined, monaco: Monaco) {
    const kinds = monaco.languages.CompletionItemKind;

    const mapping: Record<number, languages.CompletionItemKind> = {
      1: kinds.Text,
      2: kinds.Method,
      3: kinds.Function,
      4: kinds.Constructor,
      5: kinds.Field,
      6: kinds.Variable,
      7: kinds.Class,
      8: kinds.Interface,
      9: kinds.Module,
      10: kinds.Property,
      11: kinds.Enum,
      12: kinds.EnumMember,
      13: kinds.Keyword,
      14: kinds.Snippet,
      15: kinds.Color,
      16: kinds.File,
      17: kinds.Reference,
      18: kinds.Folder,
      19: kinds.Event,
      20: kinds.Operator,
      21: kinds.TypeParameter,
    };

    return mapping[kind ?? 1] ?? kinds.Text;
  }

  #markupToString(
    value: string | { kind: string; value: string } | undefined,
  ): string {
    if (typeof value === "string") return value;
    if (!value) return "";
    return value.value;
  }

  async start() {
    this.dispose();
    this.#websocket = new WebSocket(this.#options.wsUrl);

    return new Promise<void>((resolve, reject) => {
      if (!this.#websocket) return;

      this.#websocket.onerror = (e) => reject(e);

      this.#websocket.onopen = async () => {
        if (!this.#websocket) return;

        const socket = toSocket(this.#websocket);
        const reader = new WebSocketMessageReader(socket);
        const writer = new WebSocketMessageWriter(socket);

        this.#connection = createMessageConnection(reader, writer);

        this.#connection.onNotification(
          "textDocument/publishDiagnostics",
          (params) => this.#handleDiagnostics(params),
        );

        this.#connection.listen();

        await this.#initialize();
        this.#registerProviders();

        resolve();
      };
    });
  }

  async #initialize() {
    if (!this.#connection) return;

    await this.#connection.sendRequest("initialize", {
      processId: null,
      clientInfo: { name: "Cadaide LSP Client" },
      rootUri: this.#options.rootUri,
      workspaceFolders: [
        {
          uri: this.#options.rootUri,
          name: "Workspace",
        },
      ],
      initializationOptions: {
        typescript: {
          tsdk: "./node_modules/typescript/lib",
        },
        vtsls: {
          autoUseWorkspaceTsdk: true,
        },
      },
      capabilities: {
        workspace: {
          fileOperations: {
            didRename: true,
          },
        },
        textDocument: {
          documentSymbol: {
            hierarchicalDocumentSymbolSupport: true,
          },
          publishDiagnostics: {
            relatedInformation: true,
          },
          synchronization: {
            dynamicRegistration: false,
            didSave: true,
          },
          completion: {
            completionItem: {
              snippetSupport: true,
              documentationFormat: ["markdown", "plaintext"],
              resolveSupport: {
                properties: ["documentation", "detail"],
              },
            },
          },
          hover: {
            contentFormat: ["markdown", "plaintext"],
          },
          signatureHelp: {
            signatureInformation: {
              documentationFormat: ["markdown", "plaintext"],
            },
          },
        },
      },
    });

    this.#initialized = true;
    this.#connection.sendNotification("initialized", {});
  }

  sendDidOpen(uri: string, languageId: string, text: string) {
    if (!this.#connection || !this.#initialized) return;

    this.#documentVersions.set(uri, 1);
    this.#connection.sendNotification("textDocument/didOpen", {
      textDocument: { uri, languageId, version: 1, text },
    });
  }

  sendDidChange(uri: string, text: string) {
    if (!this.#connection || !this.#initialized) return;

    const version = (this.#documentVersions.get(uri) ?? 0) + 1;

    this.#documentVersions.set(uri, version);
    this.#connection.sendNotification("textDocument/didChange", {
      textDocument: { uri, version },
      contentChanges: [{ text }],
    });
  }

  sendDidClose(uri: string) {
    if (!this.#connection || !this.#initialized) return;

    this.#documentVersions.delete(uri);
    this.#connection.sendNotification("textDocument/didClose", {
      textDocument: { uri },
    });
  }

  sendDidRename(oldUri: string, newUri: string) {
    if (!this.#connection || !this.#initialized) return;

    this.#connection.sendNotification("workspace/didRenameFiles", {
      files: [
        {
          oldUri,
          newUri,
        },
      ],
    });

    this.#connection.sendNotification("workspace/didChangeWatchedFiles", {
      changes: [
        { uri: oldUri, type: 3 },
        { uri: newUri, type: 1 },
      ],
    });
  }

  #handleDiagnostics(params: { uri: string; diagnostics: any[] }) {
    const { monaco } = this.#options;
    const model = this.#findModelByUri(params.uri);

    if (!model) return;

    const markers = params.diagnostics.map((d: any) => ({
      severity: this.#lspSeverityToMonaco(d.severity, monaco),
      message: d.message,
      startLineNumber: d.range.start.line + 1,
      startColumn: d.range.start.character + 1,
      endLineNumber: d.range.end.line + 1,
      endColumn: d.range.end.character + 1,
      source: d.source ?? "lsp",
    }));

    monaco.editor.setModelMarkers(model, "lsp", markers);
  }

  #findModelByUri(uri: string): editor.ITextModel | null {
    const { monaco } = this.#options;
    const parsed = monaco.Uri.parse(uri);

    return (
      monaco.editor.getModel(parsed) ||
      monaco.editor
        .getModels()
        .find((m: editor.ITextModel) => m.uri.path === parsed.path) ||
      null
    );
  }

  #registerProviders() {
    const { monaco } = this.#options;

    for (const langId of this.#options.languageIds) {
      this.#disposables.push(
        monaco.languages.registerCompletionItemProvider(langId, {
          triggerCharacters: ["."],
          provideCompletionItems: (
            m: editor.ITextModel,
            p: ILspClientMonacoPosition,
          ) => this.#provideCompletion(m, p),
        }),
        monaco.languages.registerHoverProvider(langId, {
          provideHover: (m: editor.ITextModel, p: ILspClientMonacoPosition) =>
            this.#provideHover(m, p),
        }),
        monaco.languages.registerSignatureHelpProvider(langId, {
          signatureHelpTriggerCharacters: ["(", ","],
          provideSignatureHelp: (
            m: editor.ITextModel,
            p: ILspClientMonacoPosition,
          ) => this.#provideSignatureHelp(m, p),
        }),
        monaco.languages.registerDefinitionProvider(langId, {
          provideDefinition: (
            m: editor.ITextModel,
            p: ILspClientMonacoPosition,
          ) => this.#provideDefinition(m, p),
        }),
        monaco.languages.registerReferenceProvider(langId, {
          provideReferences: (
            m: editor.ITextModel,
            p: ILspClientMonacoPosition,
            context: languages.ReferenceContext,
          ) => this.#provideReferences(m, p, context),
        }),
      );
    }
  }

  async #provideHover(
    model: editor.ITextModel,
    position: ILspClientMonacoPosition,
  ): Promise<languages.Hover | undefined> {
    if (!this.#connection || !this.#initialized) return undefined;

    const result: any = await this.#connection.sendRequest(
      "textDocument/hover",
      {
        textDocument: { uri: model.uri.toString() },
        position: this.#monacoToLspPosition(position),
      },
    );

    if (!result || !result.contents) return undefined;

    const { monaco } = this.#options;
    const rawContents = Array.isArray(result.contents)
      ? result.contents
      : [result.contents];

    const contents = rawContents.map((content: any) => {
      if (typeof content === "string")
        return { value: content, isTrusted: true };

      if (content.value !== undefined)
        return { value: content.value, isTrusted: true, supportHtml: true };

      return { value: "", isTrusted: true };
    });

    return {
      contents,
      range: result.range
        ? this.#lspToMonacoRange(result.range, monaco)
        : undefined,
    };
  }

  async #provideCompletion(
    model: editor.ITextModel,
    position: ILspClientMonacoPosition,
  ): Promise<languages.CompletionList | undefined> {
    if (!this.#connection || !this.#initialized) return undefined;

    const result: any = await this.#connection.sendRequest(
      "textDocument/completion",
      {
        textDocument: { uri: model.uri.toString() },
        position: this.#monacoToLspPosition(position),
      },
    );

    if (!result) return undefined;

    const items = Array.isArray(result) ? result : (result.items ?? []);
    const { monaco } = this.#options;
    const word = model.getWordUntilPosition(position);

    return {
      suggestions: items.map((item: any) => ({
        label: item.label,
        kind: this.#lspCompletionItemKindToMonaco(item.kind, monaco),
        insertText: item.insertText ?? item.label,
        detail: item.detail,
        documentation: item.documentation
          ? {
              value: this.#markupToString(item.documentation),
              isTrusted: true,
            }
          : undefined,
        range: {
          startLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endLineNumber: position.lineNumber,
          endColumn: word.endColumn,
        },
      })),
    };
  }

  async #provideSignatureHelp(
    model: editor.ITextModel,
    position: ILspClientMonacoPosition,
  ): Promise<languages.SignatureHelpResult | undefined> {
    if (!this.#connection || !this.#initialized) return undefined;

    const result: any = await this.#connection.sendRequest(
      "textDocument/signatureHelp",
      {
        textDocument: { uri: model.uri.toString() },
        position: this.#monacoToLspPosition(position),
      },
    );

    if (!result) return undefined;

    return {
      value: {
        signatures: (result.signatures ?? []).map((sig: any) => ({
          label: sig.label,
          documentation: sig.documentation
            ? { value: this.#markupToString(sig.documentation) }
            : undefined,
          parameters: (sig.parameters ?? []).map((p: any) => ({
            label: p.label,
            documentation: p.documentation
              ? { value: this.#markupToString(p.documentation) }
              : undefined,
          })),
        })),
        activeSignature: result.activeSignature ?? 0,
        activeParameter: result.activeParameter ?? 0,
      },
      dispose() {},
    };
  }

  async #provideDefinition(
    model: editor.ITextModel,
    position: ILspClientMonacoPosition,
  ): Promise<languages.Definition | undefined> {
    if (!this.#connection || !this.#initialized) return undefined;

    const result: any = await this.#connection.sendRequest(
      "textDocument/definition",
      {
        textDocument: { uri: model.uri.toString() },
        position: this.#monacoToLspPosition(position),
      },
    );

    if (!result) return undefined;

    const { monaco } = this.#options;
    const locations = Array.isArray(result) ? result : [result];

    return locations.map((loc: any) => ({
      uri: monaco.Uri.parse(loc.uri),
      range: this.#lspToMonacoRange(loc.range, monaco),
    }));
  }

  async #provideReferences(
    model: editor.ITextModel,
    position: ILspClientMonacoPosition,
    context: languages.ReferenceContext,
  ): Promise<languages.Location[] | undefined> {
    if (!this.#connection || !this.#initialized) return undefined;

    const result: any = await this.#connection.sendRequest(
      "textDocument/references",
      {
        textDocument: { uri: model.uri.toString() },
        position: this.#monacoToLspPosition(position),
        context: { includeDeclaration: context.includeDeclaration },
      },
    );

    if (!result) return undefined;

    const { monaco } = this.#options;
    const locations = Array.isArray(result) ? result : [result];

    return locations.map((loc: any) => ({
      uri: monaco.Uri.parse(loc.uri),
      range: this.#lspToMonacoRange(loc.range, monaco),
    }));
  }

  async getDocumentSymbols(uri: monaco.Uri) {
    if (!this.#connection || !this.#initialized) return [];

    const result: any = await this.#connection.sendRequest(
      "textDocument/documentSymbol",
      { textDocument: { uri: uri.toString() } },
    );

    return result;
  }

  async findReferences(
    uri: monaco.Uri,
    position: { line: number; character: number },
  ) {
    if (!this.#connection || !this.#initialized) return [];

    const result: any = await this.#connection.sendRequest(
      "textDocument/references",
      {
        textDocument: { uri: uri.toString() },
        position: position,
        context: { includeDeclaration: true },
      },
    );

    return result;
  }

  dispose() {
    this.#disposables.forEach((d) => d.dispose());
    this.#disposables = [];
    this.#connection?.dispose();
    this.#websocket?.close();
    this.#initialized = false;
  }
}
