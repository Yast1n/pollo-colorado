import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Flip } from 'gsap/Flip'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, Flip, useGSAP)

// Curvas de la marca: salidas rápidas que frenan suave (sensación de "chispa").
gsap.defaults({ ease: 'expo.out', duration: 0.9 })

export const MQ = {
  motion: '(prefers-reduced-motion: no-preference)',
  reduce: '(prefers-reduced-motion: reduce)',
  desktop: '(min-width: 768px)',
}

export { gsap, ScrollTrigger, Flip, useGSAP }
