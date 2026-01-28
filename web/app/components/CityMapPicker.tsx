'use client'

import { useEffect, useRef, useCallback } from 'react'
import type L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export type MapSearchResult = {
  lat: string
  lon: string
  display_name: string
  address?: { city?: string; town?: string; village?: string; country?: string }
}

type CityMapPickerProps = {
  results: MapSearchResult[]
  selected: { lat: string; lon: string } | null
  onSelect: (r: MapSearchResult) => void
  className?: string
}

export default function CityMapPicker({ results, selected, onSelect, className = '' }: CityMapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const leafletRef = useRef<typeof L | null>(null)

  const clearMarkers = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    markersRef.current.forEach((m) => map.removeLayer(m))
    markersRef.current = []
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return
    let cancelled = false
    import('leaflet').then((mod) => {
      if (cancelled || !containerRef.current || mapRef.current) return
      const L = mod.default
      const map = L.map(containerRef.current).setView([50.45, 30.52], 4)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
      }).addTo(map)
      mapRef.current = map
      leafletRef.current = L
    })
    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      leafletRef.current = null
      markersRef.current = []
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const L = leafletRef.current
    if (!map || !L) return

    clearMarkers()

    const icon = L.divIcon({
      className: 'city-picker-marker',
      html: '<span style="background:#145142;color:#fff;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)">📍</span>',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    })

    if (selected) {
      const lat = parseFloat(selected.lat)
      const lng = parseFloat(selected.lon)
      if (!isNaN(lat) && !isNaN(lng)) {
        const m = L.marker([lat, lng], { icon }).addTo(map)
        markersRef.current = [m]
        map.setView([lat, lng], 12)
      }
      return
    }

    if (results.length === 0) return

    const list: L.Marker[] = []
    results.forEach((r) => {
      const lat = parseFloat(r.lat)
      const lng = parseFloat(r.lon)
      if (isNaN(lat) || isNaN(lng)) return
      const m = L.marker([lat, lng], { icon })
        .on('click', () => onSelect(r))
        .addTo(map)
      list.push(m)
    })
    markersRef.current = list

    if (results.length === 1) {
      const r = results[0]
      map.setView([parseFloat(r.lat), parseFloat(r.lon)], 12)
    } else if (results.length > 1) {
      const group = L.featureGroup(list)
      map.fitBounds(group.getBounds().pad(0.15))
    }
  }, [results, selected, onSelect, clearMarkers])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ minHeight: 280, borderRadius: 14, overflow: 'hidden', background: '#e5e7eb' }}
    />
  )
}
