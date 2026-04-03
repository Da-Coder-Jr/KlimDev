declare global {
  const KLIMDEV_VERSION: string
  const KLIMDEV_CHANNEL: string
}

export const VERSION = typeof KLIMDEV_VERSION === "string" ? KLIMDEV_VERSION : "local"
export const CHANNEL = typeof KLIMDEV_CHANNEL === "string" ? KLIMDEV_CHANNEL : "local"
