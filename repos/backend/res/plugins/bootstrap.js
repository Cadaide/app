function ___cadaide_internal_bootstrap() {
  ___cadaide_internal_setupEnvironment();
  ___cadaide_internal_evalPlugin();
  ___cadaide_internal_notifyReady();
}

function ___cadaide_internal_notifyReady() {
  globalThis.___cadaide_internal.exec({ type: 'api:initialize', args: [{}] });
}

function ___cadaide_internal_evalPlugin() {
  try {
    // {{cadaide:plugcode}}
  } catch (e) {
    globalThis.cadaide.notifications.error(
      'Plugin exception: ' + ___cadaide_internal_stringify(e),
    );
  }
}

function ___cadaide_internal_setupEnvironment() {
  const cadaideInt = globalThis.___cadaide_internal;

  cadaideInt.__listeners = {};
  cadaideInt.on = (event, callback) => {
    if (!cadaideInt.__listeners[event]) cadaideInt.__listeners[event] = [];

    cadaideInt.__listeners[event].push(callback);
  };
  cadaideInt.emit = (event, args) => {
    const listeners = cadaideInt.__listeners[event];
    if (!listeners) return;

    const parsedArgs = JSON.parse(args);

    for (const listener of listeners) {
      try {
        listener(...parsedArgs);
      } catch (e) {
        globalThis.cadaide.notifications.error(
          'Plugin exception: ' + ___cadaide_internal_stringify(e),
        );
      }
    }
  };

  cadaideInt.exec = (data) => {
    const str = JSON.stringify(data);
    const res = cadaideInt.execraw(str);
    if (!res) return undefined;

    return JSON.parse(res);
  };

  const cadaide = {
    notifications: {
      info: (msg) => ___cadaide_fn_notifications_send('info', msg),
      warning: (msg) => ___cadaide_fn_notifications_send('warning', msg),
      error: (msg) => ___cadaide_fn_notifications_send('error', msg),
      success: (msg) => ___cadaide_fn_notifications_send('success', msg),
    },
    on: ___cadaide_internal.on,
  };

  globalThis.___cadaide_internal = cadaideInt;
  globalThis.cadaide = cadaide;
}

function ___cadaide_fn_notifications_send(type, message) {
  ___cadaide_internal.exec({
    type: 'api:notify',
    args: [type, message],
  });
}

function ___cadaide_internal_stringify(data) {
  let textStr = data;

  if (data instanceof Error) textStr = data.message;
  else if (typeof data === 'object') {
    try {
      textStr = JSON.stringify(data);
    } catch {
      textStr = String(data);
    }
  } else textStr = String(data);

  return textStr;
}

___cadaide_internal_bootstrap();
