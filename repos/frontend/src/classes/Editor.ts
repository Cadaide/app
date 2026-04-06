import type { editor } from "monaco-editor";
import * as monaco from "monaco-editor";
import { pathToName } from "@/utils/files/file";
import { API } from "@/api";
import { EditorHook, EditorHookId } from "./EditorHook";

export class Editor {
  static #instance: Editor;

  static get instance() {
    if (!Editor.#instance) Editor.#instance = new Editor();

    return Editor.#instance;
  }

  #editor: editor.IStandaloneCodeEditor | null = null;
  #models: Map<string, editor.ITextModel> = new Map();

  #modelsLoaded: boolean = false;
  #editorMounted: boolean = false;

  #initializedListeners: (() => void)[] = [];

  #hooks: EditorHook[] = [];

  constructor() {}

  set editor(editor: editor.IStandaloneCodeEditor) {
    this.#editor = editor;
  }

  get editor(): editor.IStandaloneCodeEditor {
    if (!this.#editor) throw new Error("Editor not initialized");

    return this.#editor;
  }

  addModel(model: editor.ITextModel) {
    if (this.#models.has(model.uri.toString())) return;

    this.#models.set(model.uri.toString(), model);
  }

  clearModels() {
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

  markModelsLoaded() {
    this.#modelsLoaded = true;

    this.#notifyIfInitialized();
  }

  markEditorMounted() {
    this.#editorMounted = true;

    this.#notifyIfInitialized();
  }

  #notifyIfInitialized() {
    if (this.#modelsLoaded && this.#editorMounted) {
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

  openFile(path: string | null) {
    if (!path) {
      if (!this.#editorMounted) return;

      this.editor.setModel(null);

      return;
    }

    const normalizedPath = path.replaceAll("\\", "/");
    const fileUri = monaco.Uri.file(normalizedPath);
    const model = this.getModel(fileUri.toString());

    if (!model) return;

    this.editor.setModel(model);

    //window.api.setActivity(pathToName(path));
  }

  async saveFile(path: string, content: string) {
    await API.fs.writeFile(path, content);

    this.notifyHook(EditorHookId.EditorSave, { path });
  }
}
