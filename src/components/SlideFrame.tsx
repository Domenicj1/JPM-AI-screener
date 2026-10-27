import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'

// Every slide is designed at a fixed 1280 x 720 (16:9) size, like a real
// presentation. SlideFrame scales that canvas to fit whatever box it is in,
// so the same slide works as a thumbnail, in the editor, and full screen.

export const SLIDE_W = 1280
export const SLIDE_H = 720

export function SlideFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  const outer = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const el = outer.current
    if (!el) return
    const update = () => {
      const { width, height } = el.getBoundingClientRect()
      // Fit by width, and also by height when the box has a fixed height.
      const byWidth = width / SLIDE_W
      const byHeight = height > 0 ? height / SLIDE_H : byWidth
      setScale(Math.min(byWidth, byHeight))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={outer} className={`slide-frame ${className}`}>
      <div className="slide" style={{ transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  )
}
