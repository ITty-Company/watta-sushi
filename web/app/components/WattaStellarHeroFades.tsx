'use client'

/** Stellar-style white gradient masks (z-5, під текстом z-20). */
export default function WattaStellarHeroFades() {
  return (
    <div className="watta-stellar-hero-fades menu-stellar-hero-fades pointer-events-none absolute inset-0 z-[5]" aria-hidden>
      <div className="watta-stellar-hero-bg__fade watta-stellar-hero-bg__fade--top-shadow menu-stellar-hero-bg__fade menu-stellar-hero-bg__fade--top-shadow" />
      <div className="watta-stellar-hero-bg__fade watta-stellar-hero-bg__fade--general menu-stellar-hero-bg__fade menu-stellar-hero-bg__fade--general hidden md:block" />
      <div className="watta-stellar-hero-bg__fade watta-stellar-hero-bg__fade--desktop menu-stellar-hero-bg__fade menu-stellar-hero-bg__fade--desktop hidden md:block" />
      <div className="watta-stellar-hero-bg__fade watta-stellar-hero-bg__fade--mobile menu-stellar-hero-bg__fade menu-stellar-hero-bg__fade--mobile md:hidden" />
      <div className="watta-stellar-hero-bg__fade watta-stellar-hero-bg__fade--bottom-shadow menu-stellar-hero-bg__fade menu-stellar-hero-bg__fade--bottom-shadow" />
      <div className="watta-stellar-hero-bg__fade watta-stellar-hero-bg__fade--bottom menu-stellar-hero-bg__fade menu-stellar-hero-bg__fade--bottom hidden md:block" />
      <div className="watta-stellar-hero-bg__fade watta-stellar-hero-bg__fade--bottom watta-stellar-hero-bg__fade--bottom-mobile menu-stellar-hero-bg__fade menu-stellar-hero-bg__fade--bottom menu-stellar-hero-bg__fade--bottom-mobile md:hidden" />
    </div>
  )
}
