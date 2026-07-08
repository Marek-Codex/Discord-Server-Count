'use client'

import { useEffect, useRef } from 'react'

type Dot = { x: number; y: number; vx: number; vy: number; radius: number }

export function PlexusCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let dots: Dot[] = []
    let width = 0
    let height = 0
    let frame = 0

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = width * dpr
      canvas.height = height * dpr
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      dots = Array.from(
        {
          length: Math.min(
            120,
            Math.max(65, Math.round((width * height) / 16000)),
          ),
        },
        () => ({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * (reduced ? 0.25 : 0.8),
          vy: (Math.random() - 0.5) * (reduced ? 0.25 : 0.8),
          radius: 0.8 + Math.random() * 1.5,
        }),
      )
    }

    const draw = () => {
      frame = requestAnimationFrame(draw)
      context.clearRect(0, 0, width, height)
      for (const dot of dots) {
        dot.x = (dot.x + dot.vx + width) % width
        dot.y = (dot.y + dot.vy + height) % height
      }
      dots.forEach((dot, index) => {
        dots.slice(index + 1).forEach((next) => {
          const distance = Math.hypot(dot.x - next.x, dot.y - next.y)
          if (distance < 125) {
            context.strokeStyle = `rgba(60,160,255,${(1 - distance / 125) * 0.35})`
            context.lineWidth = 0.7
            context.beginPath()
            context.moveTo(dot.x, dot.y)
            context.lineTo(next.x, next.y)
            context.stroke()
          }
        })
        context.fillStyle = 'rgba(225,240,255,.75)'
        context.beginPath()
        context.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2)
        context.fill()
      })
    }

    resize()
    draw()
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={ref} id="plexus-canvas" aria-hidden="true" />
}
