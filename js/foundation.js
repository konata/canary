const $ = (sel) =>
  sel.match(/^#/)
    ? document.querySelector(sel)
    : [...document.querySelectorAll(sel)]

const delay = (ms) => new Promise((resolve, _) => setTimeout(resolve, ms))

const dump = (win) => {
  // js bridge must have a layout like
  // window.obj.fun
  // which will be recognized as `native function`

  const bridges = Object.entries(win)
    .filter(
      ([, value]) =>
        value &&
        typeof value == 'object' &&
        Object.getPrototypeOf(value).toString() == '[object Object]' // filter value must be non-null Object
    )
    .filter(
      ([, value]) =>
        Object.values(value).every(
          (fn) =>
            typeof fn == 'function' && fn.toString().includes('native code')
        ) // filter every property must be native code
    )
    .map(([key, value]) => [
      key,
      Object.fromEntries(
        Object.keys(value).map((it) => [it, '[Native Function]'])
      ), // transform keys to str representation
    ])

  return Object.fromEntries(bridges)
}
