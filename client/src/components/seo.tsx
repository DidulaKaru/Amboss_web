import { useEffect } from 'react'

const SITE_URL = 'https://amboss.lk'
const DEFAULT_IMAGE = `${SITE_URL}/images/amboss-logo.png`

type SeoProps = {
  title: string
  description: string
  path: string
  keywords?: string
  image?: string
  noindex?: boolean
  jsonLd?: Record<string, unknown>
}

const upsertMeta = (selector: string, attribute: 'name' | 'property', content: string) => {
  let element = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${selector}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, selector)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

export default function Seo({ title, description, path, keywords, image = DEFAULT_IMAGE, noindex = false, jsonLd }: SeoProps) {
  useEffect(() => {
    const absoluteUrl = new URL(path, SITE_URL).toString()

    document.title = title

    upsertMeta('description', 'name', description)
    upsertMeta('robots', 'name', noindex ? 'noindex, nofollow' : 'index, follow')
    if (keywords) {
      upsertMeta('keywords', 'name', keywords)
    }
    upsertMeta('og:type', 'property', 'website')
    upsertMeta('og:site_name', 'property', 'AMBOSS')
    upsertMeta('og:title', 'property', title)
    upsertMeta('og:description', 'property', description)
    upsertMeta('og:url', 'property', absoluteUrl)
    upsertMeta('og:image', 'property', image)
    upsertMeta('twitter:card', 'name', 'summary_large_image')
    upsertMeta('twitter:title', 'name', title)
    upsertMeta('twitter:description', 'name', description)
    upsertMeta('twitter:image', 'name', image)

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', absoluteUrl)

    const existingJsonLd = document.getElementById('seo-jsonld')
    if (existingJsonLd) {
      existingJsonLd.remove()
    }

    if (jsonLd) {
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.id = 'seo-jsonld'
      script.text = JSON.stringify(jsonLd)
      document.head.appendChild(script)
    }
  }, [title, description, path, keywords, image, jsonLd, noindex])

  return null
}