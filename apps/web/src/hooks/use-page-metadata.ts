import { useEffect } from "react"

interface PageMetadata {
  robots?: string
  title: string
}

export function usePageMetadata({ robots, title }: PageMetadata) {
  useEffect(() => {
    const previousTitle = document.title
    const robotsMeta = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
    const previousRobots = robotsMeta?.content

    document.title = title
    if (robots) robotsMeta?.setAttribute("content", robots)

    return () => {
      document.title = previousTitle
      if (robots && previousRobots) robotsMeta?.setAttribute("content", previousRobots)
    }
  }, [robots, title])
}
