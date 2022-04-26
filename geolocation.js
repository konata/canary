const promisify =
  (fn) =>
  (...args) =>
    new Promise((resolve, reject) => fn(resolve, reject, ...args))

const getCurrentPosition = promisify(
  navigator.geolocation.getCurrentPosition.bind(navigator.geolocation)
)

document.querySelector('#geolocation').onclick = async () => {
  const logger = document.querySelector('#logger')
  try {
    const opts = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    }
    const {
      coords: { accuracy, latitude, longitude },
    } = await getCurrentPosition(opts)
    logger.innerHTML = JSON.stringify({ accuracy, latitude, longitude })
  } catch (e) {
    logger.innerHTML = e.message
  }
}
