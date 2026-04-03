// logo.tsx -- KlimDev brand identity components
//
// Mark:   Small square "K" icon used in tab headers and compact contexts.
// Splash: Large loading-screen version of the mark.
// Logo:   Full "KLIMDEV" wordmark used on the home screen.
//
// All shapes are pure SVG paths using the same block-pixel grid as the
// original opencode wordmark (6-unit cells, 30-unit letter height, y=6–36).
// The Stapler Red accent is inherited via --icon-strong-base so it responds
// to the active theme.

import { ComponentProps } from "solid-js"

// ---------------------------------------------------------------------------
// Mark -- compact "K" icon (16x20 viewBox)
// ---------------------------------------------------------------------------
export const Mark = (props: { class?: string }) => {
  return (
    <svg
      data-component="logo-mark"
      classList={{ [props.class ?? ""]: !!props.class }}
      viewBox="0 0 16 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Vertical left bar of K */}
      <rect x="0" y="0" width="4" height="20" fill="var(--icon-strong-base)" />
      {/* Upper diagonal arm of K */}
      <rect x="4" y="0" width="5" height="4" fill="var(--icon-strong-base)" />
      <rect x="9" y="4" width="4" height="4" fill="var(--icon-strong-base)" />
      <rect x="13" y="0" width="3" height="4" fill="var(--icon-weak-base)" />
      {/* Mid-point crossbar */}
      <rect x="4" y="8" width="4" height="4" fill="var(--icon-strong-base)" />
      {/* Lower diagonal arm of K */}
      <rect x="8" y="12" width="4" height="4" fill="var(--icon-strong-base)" />
      <rect x="12" y="16" width="4" height="4" fill="var(--icon-strong-base)" />
      <rect x="8" y="16" width="4" height="4" fill="var(--icon-weak-base)" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Splash -- large loading-screen mark (80x100 viewBox)
// ---------------------------------------------------------------------------
export const Splash = (props: Pick<ComponentProps<"svg">, "ref" | "class">) => {
  return (
    <svg
      ref={props.ref}
      data-component="logo-splash"
      classList={{ [props.class ?? ""]: !!props.class }}
      viewBox="0 0 80 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Vertical left bar */}
      <rect x="0" y="0" width="20" height="100" fill="var(--icon-strong-base)" />
      {/* Upper arm */}
      <rect x="20" y="0" width="25" height="20" fill="var(--icon-strong-base)" />
      <rect x="45" y="20" width="20" height="20" fill="var(--icon-strong-base)" />
      <rect x="65" y="0" width="15" height="20" fill="var(--icon-weak-base)" />
      {/* Mid crossbar */}
      <rect x="20" y="40" width="20" height="20" fill="var(--icon-strong-base)" />
      {/* Lower arm */}
      <rect x="40" y="60" width="20" height="20" fill="var(--icon-strong-base)" />
      <rect x="60" y="80" width="20" height="20" fill="var(--icon-strong-base)" />
      <rect x="40" y="80" width="20" height="20" fill="var(--icon-weak-base)" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Logo -- full "KLIMDEV" wordmark (210x42 viewBox, same grid as opencode)
//
// Grid: 6-unit cells. Each letter is drawn in the y=6..36 band (30 units tall).
// Letters are spaced 30 units apart (24 wide + 6 gap).
// Shadow rects use var(--icon-weak-base); main shapes use var(--icon-strong-base).
//
// Letter offsets: K=0  L=30  I=60  M=84  D=114  E=144  V=174
// ---------------------------------------------------------------------------
export const Logo = (props: { class?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 210 42"
      fill="none"
      classList={{ [props.class ?? ""]: !!props.class }}
    >
      <g>
        {/* ---- K (x offset 0) ---- */}
        {/* Left vertical bar */}
        <rect x="0"  y="6"  width="6" height="30" fill="var(--icon-strong-base)" />
        {/* Upper-right arm */}
        <rect x="6"  y="6"  width="12" height="6"  fill="var(--icon-strong-base)" />
        <rect x="12" y="12" width="6"  height="6"  fill="var(--icon-strong-base)" />
        <rect x="18" y="6"  width="6"  height="6"  fill="var(--icon-weak-base)" />
        {/* Mid crossbar */}
        <rect x="6"  y="18" width="6"  height="6"  fill="var(--icon-strong-base)" />
        {/* Lower-right arm */}
        <rect x="12" y="24" width="6"  height="6"  fill="var(--icon-strong-base)" />
        <rect x="18" y="30" width="6"  height="6"  fill="var(--icon-strong-base)" />
        <rect x="12" y="30" width="6"  height="6"  fill="var(--icon-weak-base)" />

        {/* ---- L (x offset 30) ---- */}
        {/* Left vertical bar */}
        <rect x="30" y="6"  width="6" height="30" fill="var(--icon-strong-base)" />
        {/* Bottom horizontal bar */}
        <rect x="36" y="30" width="18" height="6"  fill="var(--icon-strong-base)" />
        <rect x="36" y="24" width="18" height="6"  fill="var(--icon-weak-base)" />

        {/* ---- I (x offset 60, narrow 18 wide) ---- */}
        {/* Top cap */}
        <rect x="60" y="6"  width="18" height="6"  fill="var(--icon-strong-base)" />
        {/* Center bar */}
        <rect x="66" y="12" width="6"  height="18" fill="var(--icon-strong-base)" />
        {/* Bottom cap */}
        <rect x="60" y="30" width="18" height="6"  fill="var(--icon-strong-base)" />
        <rect x="60" y="24" width="18" height="6"  fill="var(--icon-weak-base)" />

        {/* ---- M (x offset 84, 30 wide to fit) ---- */}
        {/* Left bar */}
        <rect x="84" y="6"  width="6"  height="30" fill="var(--icon-strong-base)" />
        {/* Right bar */}
        <rect x="108" y="6"  width="6" height="30" fill="var(--icon-strong-base)" />
        {/* Left peak */}
        <rect x="90" y="6"  width="6"  height="6"  fill="var(--icon-strong-base)" />
        {/* Right peak */}
        <rect x="102" y="6" width="6"  height="6"  fill="var(--icon-strong-base)" />
        {/* Center valley */}
        <rect x="96" y="12" width="6"  height="6"  fill="var(--icon-strong-base)" />
        {/* Shadow fill */}
        <rect x="90" y="12" width="18" height="6"  fill="var(--icon-weak-base)" />

        {/* ---- D (x offset 114) ---- */}
        {/* Left bar */}
        <rect x="114" y="6"  width="6"  height="30" fill="var(--icon-strong-base)" />
        {/* Top horizontal */}
        <rect x="120" y="6"  width="12" height="6"  fill="var(--icon-strong-base)" />
        {/* Right vertical */}
        <rect x="132" y="12" width="6"  height="18" fill="var(--icon-strong-base)" />
        {/* Bottom horizontal */}
        <rect x="120" y="30" width="12" height="6"  fill="var(--icon-strong-base)" />
        {/* Shadow */}
        <rect x="120" y="24" width="12" height="6"  fill="var(--icon-weak-base)" />

        {/* ---- E (x offset 144) ---- */}
        {/* Left bar */}
        <rect x="144" y="6"  width="6"  height="30" fill="var(--icon-strong-base)" />
        {/* Top bar */}
        <rect x="150" y="6"  width="18" height="6"  fill="var(--icon-strong-base)" />
        {/* Middle bar */}
        <rect x="150" y="18" width="12" height="6"  fill="var(--icon-strong-base)" />
        {/* Bottom bar */}
        <rect x="150" y="30" width="18" height="6"  fill="var(--icon-strong-base)" />
        {/* Shadow */}
        <rect x="150" y="24" width="18" height="6"  fill="var(--icon-weak-base)" />

        {/* ---- V (x offset 174) ---- */}
        {/* Left arm going down-right */}
        <rect x="174" y="6"  width="6"  height="6"  fill="var(--icon-strong-base)" />
        <rect x="180" y="12" width="6"  height="6"  fill="var(--icon-strong-base)" />
        <rect x="186" y="18" width="6"  height="6"  fill="var(--icon-strong-base)" />
        <rect x="186" y="24" width="6"  height="6"  fill="var(--icon-weak-base)" />
        {/* Right arm going down-left */}
        <rect x="198" y="6"  width="6"  height="6"  fill="var(--icon-strong-base)" />
        <rect x="192" y="12" width="6"  height="6"  fill="var(--icon-strong-base)" />
        {/* Center meeting point */}
        <rect x="186" y="30" width="6"  height="6"  fill="var(--icon-strong-base)" />
      </g>
    </svg>
  )
}
