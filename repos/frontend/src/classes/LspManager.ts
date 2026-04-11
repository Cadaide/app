import { editor } from "monaco-editor";
import { LspClient } from "./LspClient";
import { Workspace } from "./Workspace";
import * as monaco from "monaco-editor";
import { getLspLanguage } from "@/editor/languages";
import { pathToName } from "@/utils/files/file";

const lsps = {
  python: {
    id: "python",
    languageIds: ["python"],
  },
};

export class LspManager {
  #clients: Map<string, LspClient> = new Map();
  #workspace: Workspace | null = null;
  #monaco: typeof monaco | null = null;

  constructor() {}

  setWorkspace(workspace: Workspace) {
    this.#workspace = workspace;
  }

  setMonaco(m: typeof monaco) {
    this.#monaco = m;
  }

  async #getLspForLanguage(languageId: string) {
    if (!this.#workspace) throw new Error("Workspace not set");
    if (!this.#monaco) throw new Error("Monaco not set");

    const lsp = this.#clients.has(languageId)
      ? this.#clients.get(languageId)
      : null;
    if (lsp) return lsp;

    const projectPath = this.#workspace.path.replaceAll("\\", "/");

    const client = new LspClient({
      wsUrl: `ws://localhost:3001/lsp?language=${languageId}`,
      monaco: this.#monaco,
      languageIds: [languageId],
      rootUri: this.#monaco.Uri.file(projectPath).toString(),
    });

    this.#clients.set(languageId, client);

    await client.start();

    return client;
  }

  async notifyFileOpen(model: editor.ITextModel) {
    const lspLanguage = model.getLanguageId();
    if (!lspLanguage) return;

    const client = await this.#getLspForLanguage(lspLanguage);

    client.sendDidOpen(
      model.uri.toString(),
      getLspLanguage(pathToName(model.uri.path)),
      model.getValue(),
    );
  }

  notifyFileChange(model: editor.ITextModel) {
    const lspLanguage = model.getLanguageId();
    if (!lspLanguage) return;

    const client = this.#clients.get(lspLanguage);
    if (!client) return;

    client.sendDidChange(model.uri.toString(), model.getValue());
  }

  async getDocumentSymbols(uri: monaco.Uri, languageId: string) {
    const client = await this.#getLspForLanguage(languageId);

    return client.getDocumentSymbols(uri);
  }

  async findReferences(
    uri: monaco.Uri,
    position: { line: number; character: number },
    languageId: string,
  ) {
    const client = await this.#getLspForLanguage(languageId);

    return client.findReferences(uri, position);
  }
}
