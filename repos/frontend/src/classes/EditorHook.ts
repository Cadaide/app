export enum EditorHookId {
  ModelChange = "model.change",
  EditorSave = "editor.save",
}

export class EditorHook {
  #id: EditorHookId;
  #callback: (...args: any) => void;

  constructor(id: EditorHookId, callback: (...args: any) => void) {
    this.#id = id;
    this.#callback = callback;
  }

  get id() {
    return this.#id;
  }

  notify(...args: any) {
    this.#callback(...args);
  }

  dispose() {
    this.#callback = () => {};
  }
}
