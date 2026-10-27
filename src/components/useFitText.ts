import { useLayoutEffect, useRef } from 'react'

// Shrinks the text inside an element until it fits the element's height.
// The element needs a bounded height (for example flex: 1 with min-height: 0)
// so that overflowing text shows up as scrollHeight > clientHeight. It starts
// at maxPx and steps down 1px at a time, stopping at minPx so text stays
// readable on a projector. The slide's scale() transform does not affect
// these measurements, so the result is the same at every zoom level.
// Pass the text as `content` so the fit is redone whenever it changes.

export function useFitText<T extends HTMLElement>(maxPx: number, minPx: number, content: unknown) {
  const ref = useRef<T>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const fit = () => {
      let size = maxPx
      el.style.fontSize = `${size}px`
      while (el.scrollHeight > el.clientHeight && size > minPx) {
        size -= 1
        el.style.fontSize = `${size}px`
      }
    }
    fit()
    // Text measured before the web font loads can change size once it arrives.
    void document.fonts?.ready.then(fit)
  }, [maxPx, minPx, content])

  return ref
}
