import type { QuickJSContext, QuickJSRuntime } from "quickjs-emscripten";

export class VMTimeoutsJSLib {
  #timeouts: Map<number, NodeJS.Timeout> = new Map();

  create(runtime: QuickJSRuntime, context: QuickJSContext) {
    const hostSetTimeoutHandle = context.newFunction(
      "setTimeout",
      (_id, _delay) => {
        const id = context.dump(_id) as number;
        const delay = context.dump(_delay) as number;

        const timeout = setTimeout(() => {
          this.#timeouts.delete(id);
          if (!context || !context.alive) return;

          const vmTimeouts = context.getProp(context.global, "___vm_timeouts");
          const fireHandle = context.getProp(vmTimeouts, "fireTimeout");
          const idArg = context.newNumber(id);

          const result = context.callFunction(
            fireHandle,
            context.undefined,
            idArg,
          );

          if (result.error) {
            console.error(
              "[PLUGIN VM] Error while firing timeout:",
              context.dump(result.error),
            );
            result.error.dispose();
          } else result.value.dispose();

          idArg.dispose();
          fireHandle.dispose();
          vmTimeouts.dispose();
        }, delay);

        this.#timeouts.set(id, timeout);

        _id.dispose();
        _delay.dispose();
      },
    );

    const hostClearTimeoutHandle = context.newFunction(
      "clearTimeout",
      (_id) => {
        const id = context.dump(_id) as number;
        const timeout = this.#timeouts.get(id);

        if (timeout) {
          clearTimeout(timeout);

          this.#timeouts.delete(id);
        }

        _id.dispose();
      },
    );
    const vmTimeoutsHandle = context.newObject();

    context.setProp(vmTimeoutsHandle, "setTimeout", hostSetTimeoutHandle);
    context.setProp(vmTimeoutsHandle, "clearTimeout", hostClearTimeoutHandle);
    context.setProp(context.global, "___vm_timeouts", vmTimeoutsHandle);

    hostSetTimeoutHandle.dispose();
    hostClearTimeoutHandle.dispose();
    vmTimeoutsHandle.dispose();

    const result = context.evalCode(`
      const ___vm_timers = new Map();
      let ___vm_timerId = 0;

      globalThis.setTimeout = (callback, delay, ...args) => {
        const id = ++___vm_timerId;
        ___vm_timers.set(id, { callback, args });
        
        globalThis.___vm_timeouts.setTimeout(id, delay || 0);

        return id;
      }

      globalThis.clearTimeout = (id) => {
        ___vm_timers.delete(id);
        globalThis.___vm_timeouts.clearTimeout(id);
      };

      globalThis.___vm_timeouts.fireTimeout = (id) => {
        const timer = ___vm_timers.get(id);
        if (timer) {
          ___vm_timers.delete(id);
          timer.callback(...timer.args);
        }
      }
      `);

    if (result.error) {
      console.error(
        "[PLUGIN VM] Error initializing setTimeout",
        context.dump(result.error),
      );
      result.error.dispose();
    } else result.value.dispose();
  }

  dispose() {
    for (const timeout of this.#timeouts.values()) clearTimeout(timeout);

    this.#timeouts.clear();
  }
}
