import '@babel/polyfill'

// page
type Selector = `#${string}` | `.${string}`
const $ = <T extends HTMLElement = HTMLElement>(sel: Selector) =>
  document.querySelector<T>(sel)
const delay = (ms: number) =>
  new Promise((resolve, _) => setTimeout(resolve, ms))
const dump = (win: object) => {
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
            typeof fn == 'function' && fn.toString().indexOf('native code') >= 0
        ) // filter every property must be native code
    )
    .map(([key, value]) => [
      key,
      Object.fromEntries(
        Object.keys(value).map((it) => [it, '[Native Function]'])
      ),
    ])

  return JSON.stringify(Object.fromEntries(bridges), null, 2)
}

function catching(selector: Selector, fn: ($el: HTMLElement) => Promise<void>) {
  $(selector).onclick = async () => {
    const $el = $(`${selector}-return`)
    try {
      await fn($el)
    } catch (e) {
      $el.innerText = `Fail: ${e.message}`
    }
  }
}

// page logic
document.addEventListener('DOMContentLoaded', async () => {
  // geolocation
  catching('#geolocation', async ($el) => {
    const opts = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    }
    const {
      coords: { accuracy, latitude, longitude },
    } = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, opts)
    })
    $el.innerText = JSON.stringify({
      accuracy,
      latitude,
      longitude,
    })
  })

  const message = `alert / confirm / prompt`
  ;`alert confirm prompt`.split(/\s+/).forEach(
    (it) =>
      ($(`#client-${it}`).onclick = () => {
        ;(window as any)[it]?.(message)
      })
  )

  // navigation
  const $el = $('.navbar-burger')
  $el.onclick = () => {
    const {
      dataset: { target },
    } = $el
    $(`#${target}`).classList.toggle('is-active')
    $el.classList.toggle('is-active')
  }

  // user-agent
  $('#user-agent').innerText = window.navigator.userAgent

  // bridge pairs
  $('#javascriptinterface').innerText = dump(window)

  catching('#read', async ($el) => {
    const permission = await navigator.permissions.query({
      name: 'clipboard-read' as any,
    })
    if (permission.state === 'denied') {
      $el.innerText = 'Fail: ***permission denied***'
      return
    }
    const contents = await navigator.clipboard.read()
    const types = contents.flatMap((it) => it.types)
    $el.innerText = `types: ${types.join(',')}`
  })

  catching('#launch', async ($el) => {
    const component = $<HTMLInputElement>('#component').value.replace(
      /^\s+|\s+$/g,
      ''
    )
    const [scheme, entity] = $<HTMLInputElement>('#data')
      .value.replace(/^\s+|\s+$/g, '')
      .split(/:\/+/)

    const intent = `intent://${entity ?? ''}#Intent;${
      scheme ? `scheme=${scheme};` : ''
    }action=android.intent.action.SEND;launchFlags=0x3;${
      component ? `component=${component};` : ''
    }S.android.intent.extra.HTML_TEXT=foobar;${
      component ? `SEL;component=${component};` : ''
    }end`
    $el.innerText = intent
    location.href = intent
  })

  catching('#read-text', async ($el) => {
    const permission = await navigator.permissions.query({
      name: 'clipboard-read' as any,
    })
    if (permission.state === 'denied') {
      $el.innerText = 'Fail: ***permission denied***'
      return
    }
    const text = await navigator.clipboard.readText()
    $el.innerText = text
  })

  catching('#write', async ($el) => {
    const permission = await navigator.permissions.query({
      name: 'clipboard-read' as any,
    })
    if (permission.state === 'denied') {
      $el.innerText = 'Fail: ***permission denied***'
      return
    }

    const type = 'text/plain'
    const blob = new Blob(['Wow, set clipboard from webview'], { type })
    const data = [new ClipboardItem({ [type]: blob })]
    await navigator.clipboard.write(data)
    $el.innerText = 'Success'
  })

  catching('#write-text', async ($el) => {
    const permission = await navigator.permissions.query({
      name: 'clipboard-read' as any,
    })
    if (permission.state === 'denied') {
      $el.innerText = '***permission denied***'
      return
    }
    await navigator.clipboard.writeText(`Wow, set plain text to clipboard`)
    $el.innerText = 'Success'
  })
  ;`audio video`.split(/\s+/).forEach((it) => {
    catching(`#${it}`, async ($el) => {
      const { id, active } = await navigator.mediaDevices.getUserMedia({
        [it]: true,
      })
      $el.innerText = `Stream: ${JSON.stringify({ id, active })}`
    })
  })
  ;`audio video`.split(/\s+/).forEach((it) => {
    catching(`#${it}-stop`, async ($el) => {
      const stream = await navigator.mediaDevices.getUserMedia({
        [it]: true,
      })
      const { id, active } = stream
      $el.innerText = `Stream: ${JSON.stringify({ id, active })}`
      await delay(1000)
      $el.innerText = `Close after 2s`
      await delay(2000)
      stream.getTracks().forEach((it) => it.stop())
      $el.innerText = `Stopped`
    })
  })

  catching('#onconsolemessage', async ($el) => {
    ;`debug error log info error warn`.split(/\s+/g).forEach((it) => {
      ;(console as any)[it]('hello', 'world')
    })
  })
})
