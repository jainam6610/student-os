'use client'

import { useEffect, useRef, memo } from 'react'

// ponytail: avoid the ~150KB Three.js parse on low-end hardware and when
// the user opted into reduced motion. heuristic ceiling: ≤2 cores + ≤4GB RAM.
function shouldRenderCanvas(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
    const hc = (navigator as Navigator & { hardwareConcurrency?: number }).hardwareConcurrency
    const dm = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
    if (typeof hc === 'number' && hc <= 2 && typeof dm === 'number' && dm <= 4) return false
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[FocusBrainCanvas] capability check failed, allowing render:', e)
    }
    // matchMedia or properties unavailable — allow
  }
  return true
}

/**
 * FocusBrainCanvas — Three.js wireframe torus knot animation
 * 
 * Dynamically imports Three.js to avoid SSR issues and reduce initial bundle.
 * Uses a breathing scale effect + slow rotation for an ambient, meditative feel.
 */
export const FocusBrainCanvas = memo(function FocusBrainCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    // Skip the heavy Three.js load on low-end devices or when motion is
    // reduced — ambient decoration only, never required.
    if (!shouldRenderCanvas()) return

    let cancelled = false

    // Dynamic import to avoid SSR issues
    import('three').then((THREE) => {
      if (cancelled || !container) return

      const width = container.clientWidth || 300
      const height = container.clientHeight || 300

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
      })

      renderer.setSize(width, height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      container.appendChild(renderer.domElement)

      // Torus knot — elegant wireframe geometry
      const geometry = new THREE.TorusKnotGeometry(1.5, 0.4, 128, 32)
      const material = new THREE.MeshPhongMaterial({
        color: 0x7c4dff,
        shininess: 100,
        specular: 0xffffff,
        transparent: true,
        opacity: 0.8,
        wireframe: true,
      })

      const mesh = new THREE.Mesh(geometry, material)
      scene.add(mesh)

      // Ambient + point light for depth
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
      scene.add(ambientLight)

      const pointLight = new THREE.PointLight(0x7c4dff, 2)
      pointLight.position.set(5, 5, 5)
      scene.add(pointLight)

      camera.position.z = 5

      let animId: number
      let isPageVisible = document.visibilityState === 'visible'

      function animate(t: number) {
        animId = requestAnimationFrame(animate)

        if (!isPageVisible) return

        // Subtle, rhythmic rotation
        mesh.rotation.x += 0.005
        mesh.rotation.y += 0.005

        // Breathing scale effect
        const s = 1 + Math.sin(t * 0.001) * 0.1
        mesh.scale.set(s, s, s)

        renderer.render(scene, camera)
      }

      function handleVisibilityChange() {
        isPageVisible = document.visibilityState === 'visible'
      }
      document.addEventListener('visibilitychange', handleVisibilityChange)

      animate(0)

      function handleResize() {
        if (!container) return
        const w = container.clientWidth || 300
        const h = container.clientHeight || 300
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        renderer.setSize(w, h)
      }

      window.addEventListener('resize', handleResize)

      cleanupRef.current = () => {
        cancelAnimationFrame(animId)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        window.removeEventListener('resize', handleResize)
        renderer.dispose()
        geometry.dispose()
        material.dispose()
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement)
        }
      }
    }).catch((e) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[FocusBrainCanvas] failed to load:', e)
      }
      // production: fail silently — animation is decorative
    })

    return () => {
      cancelled = true
      cleanupRef.current?.()
      cleanupRef.current = null
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: 'none' }}
    />
  )
})
