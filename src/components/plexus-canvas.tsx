'use client'

import { useEffect, useRef } from 'react'

type Particle = {
  x: number
  y: number
  drawX: number
  drawY: number
  vx: number
  vy: number
  radius: number
  depth: number
  drift: number
  phase: number
}

type LinkedParticle = {
  particle: Particle
  distance: number
}

export function PlexusCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    const motionScale = reducedMotion ? 0.45 : 1
    const pointer = { x: 0, y: 0, active: false }

    let width = 0
    let height = 0
    let particles: Particle[] = []
    let lastFrame = performance.now()
    let animationFrame = 0

    function createParticle(): Particle {
      const depth = 0.55 + Math.random() * 0.9
      const angle = Math.random() * Math.PI * 2
      const speed = (0.62 + Math.random() * 0.9) * depth

      return {
        x: Math.random() * width,
        y: Math.random() * height,
        drawX: 0,
        drawY: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: (0.8 + Math.random() * 1.8) * depth,
        depth,
        drift: 0.45 + Math.random() * 0.9,
        phase: Math.random() * Math.PI * 2,
      }
    }

    function resize() {
      width = window.innerWidth
      height = window.innerHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 2)

      canvas!.width = Math.floor(width * dpr)
      canvas!.height = Math.floor(height * dpr)
      canvas!.style.width = `${width}px`
      canvas!.style.height = `${height}px`
      context!.setTransform(dpr, 0, 0, dpr, 0, 0)

      const count = Math.min(
        140,
        Math.max(72, Math.round((width * height) / 15000)),
      )
      particles = Array.from({ length: count }, createParticle)
    }

    function drawBackground() {
      const glow = context!.createRadialGradient(
        width * 0.5,
        height * 0.48,
        0,
        width * 0.5,
        height * 0.48,
        Math.max(width, height) * 0.75,
      )
      glow.addColorStop(0, 'rgba(60, 160, 255, 0.2)')
      glow.addColorStop(0.45, 'rgba(160, 60, 255, 0.055)')
      glow.addColorStop(1, 'rgba(7, 17, 28, 0)')
      context!.fillStyle = glow
      context!.fillRect(0, 0, width, height)
    }

    function moveParticle(particle: Particle, frameScale: number) {
      const frame = frameScale * motionScale
      const waveX =
        Math.cos(particle.phase * 0.73) * 0.22 * particle.drift
      const waveY = Math.sin(particle.phase) * 0.22 * particle.drift

      particle.x += (particle.vx + waveX) * frame
      particle.y += (particle.vy + waveY) * frame
      particle.phase += 0.024 * particle.depth * frame

      let offsetX = 0
      let offsetY = 0

      if (pointer.active) {
        const dx = pointer.x - particle.x
        const dy = pointer.y - particle.y
        const distance = Math.hypot(dx, dy)
        const radius = 190

        if (distance > 0 && distance < radius) {
          const influence = (1 - distance / radius) ** 2
          const offset = influence * 22 * particle.depth
          offsetX = (dx / distance) * offset
          offsetY = (dy / distance) * offset
        }
      }

      if (particle.x < -40) particle.x = width + 40
      if (particle.x > width + 40) particle.x = -40
      if (particle.y < -40) particle.y = height + 40
      if (particle.y > height + 40) particle.y = -40

      particle.drawX = particle.x + offsetX
      particle.drawY = particle.y + offsetY
    }

    function getLinkedParticles(
      origin: Particle,
      startIndex: number,
      maxDistance: number,
    ): LinkedParticle[] {
      const linked: LinkedParticle[] = []

      for (let index = startIndex; index < particles.length; index += 1) {
        const candidate = particles[index]
        const distance = Math.hypot(
          origin.drawX - candidate.drawX,
          origin.drawY - candidate.drawY,
        )
        if (distance < maxDistance) linked.push({ particle: candidate, distance })
      }

      return linked.sort((a, b) => a.distance - b.distance).slice(0, 3)
    }

    function drawFacets() {
      let filled = 0
      const fillLimit = Math.min(32, Math.round(particles.length * 0.26))

      for (
        let index = 0;
        index < particles.length && filled < fillLimit;
        index += 1
      ) {
        const particle = particles[index]
        const linked = getLinkedParticles(
          particle,
          index + 1,
          118 * particle.depth,
        )

        for (let a = 0; a < linked.length && filled < fillLimit; a += 1) {
          for (let b = a + 1; b < linked.length && filled < fillLimit; b += 1) {
            const q = linked[a].particle
            const r = linked[b].particle
            const qrDistance = Math.hypot(
              q.drawX - r.drawX,
              q.drawY - r.drawY,
            )
            const maxDistance =
              126 * Math.min(particle.depth, q.depth, r.depth)

            if (qrDistance >= maxDistance) continue

            const closeness =
              1 -
              (linked[a].distance + linked[b].distance + qrDistance) /
                (maxDistance * 3)
            const shimmer =
              0.7 + Math.sin((particle.phase + q.phase + r.phase) / 3) * 0.3
            const alpha = Math.max(0.025, closeness * 0.14 * shimmer)
            const gradient = context!.createLinearGradient(
              particle.drawX,
              particle.drawY,
              r.drawX,
              r.drawY,
            )

            gradient.addColorStop(0, `rgba(60, 160, 255, ${alpha})`)
            gradient.addColorStop(
              1,
              `rgba(160, 60, 255, ${alpha * 0.45})`,
            )
            context!.fillStyle = gradient
            context!.beginPath()
            context!.moveTo(particle.drawX, particle.drawY)
            context!.lineTo(q.drawX, q.drawY)
            context!.lineTo(r.drawX, r.drawY)
            context!.closePath()
            context!.fill()
            filled += 1
          }
        }
      }
    }

    function drawConnections() {
      for (let i = 0; i < particles.length; i += 1) {
        const particle = particles[i]

        for (let j = i + 1; j < particles.length; j += 1) {
          const next = particles[j]
          const distance = Math.hypot(
            particle.drawX - next.drawX,
            particle.drawY - next.drawY,
          )
          const maxDistance = 132 * Math.min(particle.depth, next.depth)
          if (distance >= maxDistance) continue

          const alpha = (1 - distance / maxDistance) * 0.46
          const gradient = context!.createLinearGradient(
            particle.drawX,
            particle.drawY,
            next.drawX,
            next.drawY,
          )
          gradient.addColorStop(0, `rgba(60, 160, 255, ${alpha})`)
          gradient.addColorStop(
            1,
            `rgba(160, 60, 255, ${alpha * 0.42})`,
          )

          context!.strokeStyle = gradient
          context!.lineWidth = 0.7 * Math.min(particle.depth, next.depth)
          context!.beginPath()
          context!.moveTo(particle.drawX, particle.drawY)
          context!.lineTo(next.drawX, next.drawY)
          context!.stroke()
        }
      }
    }

    function drawParticle(particle: Particle) {
      const shimmer = 0.65 + Math.sin(particle.phase) * 0.35
      const halo = context!.createRadialGradient(
        particle.drawX,
        particle.drawY,
        0,
        particle.drawX,
        particle.drawY,
        particle.radius * 8,
      )
      halo.addColorStop(0, `rgba(247, 248, 255, ${0.42 * shimmer})`)
      halo.addColorStop(0.28, `rgba(60, 160, 255, ${0.2 * shimmer})`)
      halo.addColorStop(1, 'rgba(60, 160, 255, 0)')

      context!.fillStyle = halo
      context!.beginPath()
      context!.arc(
        particle.drawX,
        particle.drawY,
        particle.radius * 8,
        0,
        Math.PI * 2,
      )
      context!.fill()

      context!.fillStyle = `rgba(247, 248, 255, ${0.82 * shimmer})`
      context!.beginPath()
      context!.arc(
        particle.drawX,
        particle.drawY,
        particle.radius,
        0,
        Math.PI * 2,
      )
      context!.fill()
    }

    function animate() {
      animationFrame = window.requestAnimationFrame(animate)
      const now = performance.now()
      const frameScale = Math.min(2.4, (now - lastFrame) / 16.67)
      lastFrame = now

      context!.clearRect(0, 0, width, height)
      drawBackground()
      particles.forEach((particle) => moveParticle(particle, frameScale))
      drawFacets()
      drawConnections()
      particles.forEach(drawParticle)
    }

    function handlePointerMove(event: PointerEvent) {
      pointer.x = event.clientX
      pointer.y = event.clientY
      pointer.active = true
    }

    function handlePointerLeave() {
      pointer.active = false
    }

    resize()
    animate()
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerleave', handlePointerLeave)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerleave', handlePointerLeave)
    }
  }, [])

  return <canvas ref={canvasRef} id="plexus-canvas" aria-hidden="true" />
}
