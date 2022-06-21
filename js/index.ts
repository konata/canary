// page
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
      ),
    ])

  return JSON.stringify(Object.fromEntries(bridges), null, 2)
}

// page logic
document.addEventListener('DOMContentLoaded', async () => {
  $('#geolocation').onclick = async () => {
    const $return = document.querySelector('#geolocation-return')
    try {
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
      $return.innerText = JSON.stringify({
        accuracy,
        latitude,
        longitude,
      })
    } catch (e) {
      $return.innerText = `Fail: ${e.message}`
    }
  }

  const message = `alert / confirm / prompt`
  ;`alert confirm prompt`.split(/\s+/).forEach(
    (it) =>
      ($(`#client-${it}`).onclick = () => {
        window[it](message)
      })
  )

  // navigation
  const $el = $('.navbar-burger')[0]
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

  // read
  $('#read').onclick = async () => {
    const $console = $('#read-return')
    try {
      const permission = await navigator.permissions.query({
        name: 'clipboard-read',
      })
      if (permission.state === 'denied') {
        $console.innerText = 'Fail: ***permission denied***'
        return
      }
      const contents = await navigator.clipboard.read()
      const types = contents.flatMap((it) => it.types)
      $console.innerText = `types: ${types.join(',')}`
    } catch (e) {
      $console.innerText = `Fail: ${e}`
    }
  }

  $('#launch').onclick = async () => {
    const $console = $('#launch-return')
    const component = $('#component').value.replace(/^\s+|\s+$/g, '')
    const [scheme, entity] = $('#data')
      .value.replace(/^\s+|\s+$/g, '')
      .split(/:\/+/)

    const intent = `intent://${entity ?? ''}#Intent;${
      scheme ? `scheme=${scheme};` : ''
    }action=android.intent.action.SEND;launchFlags=0x3;${
      component ? `component=${component};` : ''
    }S.android.intent.extra.HTML_TEXT=foobar;${
      component ? `SEL;component=${component};` : ''
    }end`

    $console.innerText = intent
    location.href = intent
  }

  // readText
  $('#read-text').onclick = async () => {
    const $console = $('#read-text-return')
    try {
      const permission = await navigator.permissions.query({
        name: 'clipboard-read',
      })
      if (permission.state === 'denied') {
        $console.innerText = 'Fail: ***permission denied***'
        return
      }
      const text = await navigator.clipboard.readText()
      $console.innerText = text
    } catch (e) {
      $console.innerText = `Fail: ${e.message}`
    }
  }

  // write
  $('#write').onclick = async () => {
    const $console = $('#write-return')
    try {
      const permission = await navigator.permissions.query({
        name: 'clipboard-read',
      })
      if (permission.state === 'denied') {
        $console.innerText = 'Fail: ***permission denied***'
        return
      }

      const type = 'text/plain'
      const blob = new Blob(['Wow, set clipboard from webview'], { type })
      const data = [new ClipboardItem({ [type]: blob })]
      await navigator.clipboard.write(data)
      $console.innerText = 'Success'
    } catch (e) {
      $console.innerText = `failed: ${e.message}`
    }
  }

  // writeText
  $('#write-text').onclick = async () => {
    const $console = $('#write-text-return')
    try {
      const permission = await navigator.permissions.query({
        name: 'clipboard-read',
      })
      if (permission.state === 'denied') {
        $console.innerText = '***permission denied***'
        return
      }

      await navigator.clipboard.writeText(`Wow, set plain text to clipboard`)

      $console.innerText = 'Success'
    } catch (e) {
      $console.innerText = `failed: ${e.message}`
    }
  }
  ;`audio video`.split(/\s+/).forEach((it) => {
    $(`#${it}`).onclick = async () => {
      const $console = $(`#${it}-return`)
      try {
        const { id, active } = await navigator.mediaDevices.getUserMedia({
          [it]: true,
        })
        $console.innerText = `Stream: ${JSON.stringify({ id, active })}`
      } catch (e) {
        $console.innerText = `Fail: ${e.message}`
      }
    }
  })
  ;`audio video`.split(/\s+/).forEach((it) => {
    $(`#${it}-stop`).onclick = async () => {
      const $console = $(`#${it}-stop-return`)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          [it]: true,
        })
        const { id, active } = stream
        $console.innerText = `Stream: ${JSON.stringify({ id, active })}`
        await delay(1000)
        $console.innerText = `Close after 2s`
        await delay(2000)
        stream.getTracks().forEach((it) => it.stop())
        $console.innerText = `Stopped`
      } catch (e) {
        $console.innerText = `Fail: ${e.message}`
      }
    }
  })

  $('#onconsolemessage').onclick = async () => {
    const $console = $('#onconsolemessage-return')
    ;`debug error log info error warn`.split(/\s+/g).forEach((it) => {
      try {
        console[it]('hello', 'world')
      } catch (e) {
        $console.innerText = `Fail: ${e.message}: ${it}`
      }
    })
  }
})
