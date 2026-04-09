'use client'

import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
export type DeliveryZoneMapZone = {
  id: string
  name: string
  color: string
  coordinates: { lat: number; lng: number }[]
  isFreeDelivery?: boolean
  flatDeliveryFee?: number | null
}

type Props = {
  zones: DeliveryZoneMapZone[]
  centerLat: number
  centerLng: number
  zoom: number
  buildPopupHtml: (zone: DeliveryZoneMapZone) => string
  /** Клік по полігону — зберегти тариф для кошика */
  onZoneSelect?: (zone: DeliveryZoneMapZone) => void
  ariaLabel: string
}

export default function DeliveryZonesInteractiveMap({
  zones,
  centerLat,
  centerLng,
  zoom,
  buildPopupHtml,
  onZoneSelect,
  ariaLabel,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<{ remove: () => void } | null>(null)
  const buildPopupHtmlRef = useRef(buildPopupHtml)
  const onZoneSelectRef = useRef(onZoneSelect)

  buildPopupHtmlRef.current = buildPopupHtml
  onZoneSelectRef.current = onZoneSelect

  useEffect(() => {
    let cancelled = false

    import('leaflet').then((L) => {
      if (cancelled || !containerRef.current) return

      delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(containerRef.current, {
        scrollWheelZoom: true,
        attributionControl: true,
      }).setView([centerLat, centerLng], zoom)

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(map)

      const group = L.featureGroup()

      for (const z of zones) {
        if (!z.coordinates || z.coordinates.length < 3) continue
        const latlngs = z.coordinates.map((p) => [p.lat, p.lng] as [number, number])
        const poly = L.polygon(latlngs, {
          color: z.color,
          fillColor: z.color,
          fillOpacity: 0.38,
          weight: 2,
          opacity: 0.95,
        })
        const html = `<div class="delivery-watta-zone-popup">${buildPopupHtmlRef.current(z)}</div>`
        poly.bindPopup(html, { maxWidth: 320, className: 'delivery-watta-leaflet-popup-wrap' })
        poly.on('click', () => {
          onZoneSelectRef.current?.(z)
          poly.openPopup()
        })
        poly.addTo(group)
      }

      group.addTo(map)

      try {
        const b = group.getBounds()
        if (b.isValid()) {
          map.fitBounds(b.pad(0.12))
        }
      } catch {
        /* ignore */
      }

      mapInstanceRef.current = map
    })

    return () => {
      cancelled = true
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
    }
  }, [zones, centerLat, centerLng, zoom])

  return (
    <div
      ref={containerRef}
      className="delivery-watta-leaflet-map h-full min-h-[min(70vh,520px)] w-full rounded-[12px] sm:min-h-[min(75vh,640px)]"
      role="region"
      aria-label={ariaLabel}
    />
  )
}
