import { useEffect } from "react"

interface PageMetadata {
  canonical?: string
  robots?: string
  title: string
}

export function usePageMetadata({ robots, title, canonical }: PageMetadata) {
  useEffect(() => {
    const previousTitle = document.title
    const robotsMeta = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
    const previousRobots = robotsMeta?.content

    const previousCanonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    const previousHref = previousCanonical?.href
    const canonicalLink = previousCanonical ?? document.createElement("link")
    if (canonical) {
      canonicalLink.rel = "canonical"
      canonicalLink.href = canonical
      if (!previousCanonical) document.head.append(canonicalLink)
    } else previousCanonical?.remove()

    document.title = title
    if (robots) robotsMeta?.setAttribute("content", robots)

    return () => {
      if (previousCanonical) {
        previousCanonical.href = previousHref!
        if (!previousCanonical.isConnected) document.head.append(previousCanonical)
      } else canonicalLink.remove()
      document.title = previousTitle
      if (robots && previousRobots) robotsMeta?.setAttribute("content", previousRobots)
    }
  }, [robots, title, canonical])
}
