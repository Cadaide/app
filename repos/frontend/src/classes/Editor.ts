import type { editor } from "monaco-editor";
import * as monaco from "monaco-editor";
import { pathToName } from "@/utils/files/file";
import { API } from "@/api";
import { EditorHook, EditorHookId } from "./EditorHook";
import { getLanguage } from "@/editor/languages";
import { LspManager } from "./LspManager";

export class Editor {
  static #instance: Editor;

  static get instance() {
    if (!Editor.#instance) Editor.#instance = new Editor();

    return Editor.#instance;
  }

  #editor: editor.IStandaloneCodeEditor | null = null;
  #monaco: typeof monaco | null = null;
  #models: Map<string, editor.ITextModel> = new Map();

  #editorMounted: boolean = false;

  #initializedListeners: (() => void)[] = [];

  #hooks: EditorHook[] = [];

  readonly lsp: LspManager = new LspManager();

  constructor() {}

  set editor(editor: editor.IStandaloneCodeEditor) {
    this.#editor = editor;
  }

  set monaco(m: typeof monaco) {
    this.#monaco = m;
  }

  get editor(): editor.IStandaloneCodeEditor {
    if (!this.#editor) throw new Error("Editor not initialized");

    return this.#editor;
  }

  get monaco(): typeof monaco {
    if (!this.#monaco) throw new Error("Monaco not initialized");

    return this.#monaco;
  }

  addModel(model: editor.ITextModel) {
    if (this.#models.has(model.uri.toString())) return;

    this.#models.set(model.uri.toString(), model);
  }

  clearModels() {
    this.#models.forEach((model) => {
      model.dispose();
    });

    this.#models.clear();
  }

  getModel(uri: string) {
    return this.#models.get(uri);
  }

  onInitialized(listener: () => void) {
    this.#initializedListeners.push(listener);

    return () => {
      this.#initializedListeners.splice(
        this.#initializedListeners.indexOf(listener),
        1,
      );
    };
  }

  markEditorMounted() {
    this.#editorMounted = true;

    this.#notifyIfInitialized();
  }

  #notifyIfInitialized() {
    if (this.#editorMounted) {
      this.#initializedListeners.forEach((listener) => {
        listener();
      });

      this.#initializedListeners = [];
    }
  }

  registerHook(hook: EditorHook) {
    this.#hooks.push(hook);
  }

  notifyHook(hookId: EditorHookId, ...args: any[]) {
    this.#hooks.forEach((hook) => {
      if (hook.id == hookId) hook.notify(...args);
    });
  }

  disposeHook(hook: EditorHook) {
    hook.dispose();

    this.#hooks.splice(this.#hooks.indexOf(hook), 1);
  }

  registerHooks(hooks: EditorHook[]) {
    hooks.forEach((hook) => this.registerHook(hook));
  }

  disposeHooks(hooks: EditorHook[]) {
    hooks.forEach((hook) => this.disposeHook(hook));
  }

  async openFile(path: string | null) {
    if (!this.#editorMounted) return;

    if (!path) {
      this.editor.setModel(null);

      return;
    }

    const normalizedPath = path.replaceAll("\\", "/");
    const fileUri = monaco.Uri.file(normalizedPath);
    let model = this.getModel(fileUri.toString());

    if (!model) {
      const content = await API.fs.readFile(path);

      model = this.monaco.editor.createModel(
        content,
        getLanguage(pathToName(path)),
        fileUri,
      );

      this.addModel(model);
    }

    this.editor.setModel(model);
    this.lsp.notifyFileOpen(model);

    this.notifyHook(EditorHookId.EditorOpen, { path, model });

    //window.api.setActivity(pathToName(path));
  }

  async closeFile(path: string) {
    const model = this.getModel(path);

    if (!model) return;

    // TODO: Add dirty warning

    this.lsp.notifyFileClose(model);

    model.dispose();
    this.#models.delete(path);
  }

  async renameFile(oldPath: string, newPath: string, isFolder: boolean = false) {
    const oldNormalized = oldPath.replaceAll("\\", "/");
    const newNormalized = newPath.replaceAll("\\", "/");

    const modelsToRename: {
      oldUri: string;
      newUri: string;
      content: string;
      language: string;
      isCurrent: boolean;
    }[] = [];

    this.#models.forEach((model, uriString) => {
      const uriPath = monaco.Uri.parse(uriString).path;

      if (
        uriPath === oldNormalized ||
        uriPath.startsWith(oldNormalized + "/")
      ) {
        const suffix = uriPath.substring(oldNormalized.length);
        const newUriPath = newNormalized + suffix;

        modelsToRename.push({
          oldUri: uriString,
          newUri: monaco.Uri.file(newUriPath).toString(),
          content: model.getValue(),
          language: model.getLanguageId(),
          isCurrent: this.#editor?.getModel()?.uri.toString() === uriString,
        });
      }
    });

    for (const item of modelsToRename) {
      const oldModel = this.#models.get(item.oldUri);

      if (oldModel) {
        this.lsp.notifyFileClose(oldModel);
        oldModel.dispose();
      }

      this.#models.delete(item.oldUri);
    }

    this.lsp.notifyFileRename(oldNormalized, newNormalized, isFolder);

    for (const item of modelsToRename) {
      const newModel = this.monaco.editor.createModel(
        item.content,
        item.language,
        monaco.Uri.parse(item.newUri),
      );

      this.addModel(newModel);
      this.lsp.notifyFileOpen(newModel);

      if (item.isCurrent && this.#editor) {
        this.#editor.setModel(newModel);
      }
    }
  }

  async saveFile(path: string, content: string) {
    await API.fs.writeFile(path, content);

    this.notifyHook(EditorHookId.EditorSave, { path });
  }
}
