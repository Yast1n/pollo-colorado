import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Flip } from 'gsap/Flip'
import { SplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, Flip, SplitText, useGSAP)

// Curvas de la marca: salidas rápidas que frenan suave (sensación de "chispa").
gsap.defaults({ ease: 'expo.out', duration: 0.9 })

export const MQ = {
  motion: '(prefers-reduced-motion: no-preference)',
  reduce: '(prefers-reduced-motion: reduce)',
  desktop: '(min-width: 768px)',
  // Solo mouse real: el tilt y el parallax de cursor no existen en pantallas táctiles.
  fine: '(hover: hover) and (pointer: fine)',
}

export const prefersReduced = () => window.matchMedia(MQ.reduce).matches

export { gsap, ScrollTrigger, Flip, SplitText, useGSAP }
