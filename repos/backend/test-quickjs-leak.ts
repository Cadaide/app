import { getQuickJS } from 'quickjs-emscripten';

async function main() {
  const qjs = await getQuickJS();
  const runtime = qjs.newRuntime();
  const vm = runtime.newContext();

  const timeouts = new Map();
  let idc = 0;

  const setTimeoutHandle = vm.newFunction('setTimeout', (fnHandle, delayHandle) => {
    const id = idc++;
    const fnDup = fnHandle.dup();
    
    const nodeTimeout = setTimeout(() => {
      if (fnDup.alive) fnDup.dispose();
      timeouts.delete(id);
    }, vm.getNumber(delayHandle));
    
    timeouts.set(id, { nodeTimeout, fnDup });
    return vm.newNumber(id);
  });
  
  vm.setProp(vm.global, 'setTimeout', setTimeoutHandle);
  setTimeoutHandle.dispose();

  const code = `
    setTimeout(() => {
      console.log("hello");
    }, 1000);
  `;
  const res = vm.evalCode(code);
  res.dispose();

  for (const {nodeTimeout, fnDup} of timeouts.values()) {
    clearTimeout(nodeTimeout);
    if (fnDup.alive) fnDup.dispose();
  }
  timeouts.clear();

  vm.dispose();
  runtime.dispose();
  console.log("OK");
}
main();
