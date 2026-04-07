'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import 'leaflet/dist/leaflet.css'

type ZoneRow = {
  id: number
  name: string
  color: string
  coordinates: string
}

type MapInst = {
  map: import('leaflet').Map
  zonesG: import('leaflet').LayerGroup
  draftG: import('leaflet').LayerGroup
  L: typeof import('leaflet')
}

type Props = {
  cityId: number
  centerLat: number
  centerLng: number
  zoom: number
  onZonesChanged: () => void
}

export default function AdminDeliveryZoneEditor({
  cityId,
  centerLat,
  centerLng,
  zoom,
  onZonesChanged,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapInst = useRef<MapInst | null>(null)
  const drawModeRef = useRef(false)
  const [mapReady, setMapReady] = useState(false)
  const [zones, setZones] = useState<ZoneRow[]>([])
  const [loading, setLoading] = useState(true)
  const [draftPoints, setDraftPoints] = useState<{ lat: number; lng: number }[]>([])
  const [drawMode, setDrawMode] = useState(false)
  const [newZoneName, setNewZoneName] = useState('')
  const [newZoneColor, setNewZoneColor] = useState('#145142')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    drawModeRef.current = drawMode
  }, [drawMode])

  const loadZones = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`/api/delivery-zones/city/${cityId}`)
      const data = r.ok ? await r.json() : []
      setZones(Array.isArray(data) ? data : [])
    } catch {
      setZones([])
    } finally {
      setLoading(false)
    }
  }, [cityId])

  useEffect(() => {
    void loadZones()
  }, [loadZones])

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

      const map = L.map(containerRef.current, { scrollWheelZoom: true }).setView([centerLat, centerLng], zoom)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
      }).addTo(map)

      const zonesG = L.layerGroup().addTo(map)
      const draftG = L.layerGroup().addTo(map)

      map.on('click', (e) => {
        if (!drawModeRef.current) return
        const { lat, lng } = e.latlng
        setDraftPoints((prev) => [...prev, { lat, lng }])
      })

      mapInst.current = { map, zonesG, draftG, L }
      setMapReady(true)
    })

    return () => {
      cancelled = true
      setMapReady(false)
      mapInst.current?.map.remove()
      mapInst.current = null
    }
  }, [centerLat, centerLng, zoom, cityId])

  useEffect(() => {
    const m = mapInst.current
    if (!m || !mapReady) return
    m.zonesG.clearLayers()
    for (const z of zones) {
      let coords: { lat: number; lng: number }[] = []
      try {
        const raw = JSON.parse(z.coordinates) as unknown
        if (Array.isArray(raw)) coords = raw as { lat: number; lng: number }[]
      } catch {
        continue
      }
      if (coords.length < 3) continue
      const latlngs = coords.map((p) => [p.lat, p.lng] as [number, number])
      const poly = m.L.polygon(latlngs, {
        color: z.color || '#145142',
        fillColor: z.color || '#145142',
        fillOpacity: 0.22,
        weight: 2,
      })
      poly.bindPopup(`<strong>${escapeHtml(z.name)}</strong>`)
      poly.addTo(m.zonesG)
    }
  }, [zones, mapReady])

  useEffect(() => {
    const m = mapInst.current
    if (!m || !mapReady) return
    m.draftG.clearLayers()
    if (draftPoints.length === 0) return
    const latlngs = draftPoints.map((p) => [p.lat, p.lng] as [number, number])
    if (draftPoints.length >= 2) {
      m.L.polyline(latlngs, { color: '#c2410c', dashArray: '6 8', weight: 2 }).addTo(m.draftG)
    }
    draftPoints.forEach((p) => {
      m.L.circleMarker([p.lat, p.lng], {
        radius: 6,
        color: '#145142',
        fillColor: '#fff',
        fillOpacity: 1,
        weight: 2,
      }).addTo(m.draftG)
    })
    if (draftPoints.length >= 3) {
      m.L.polygon(latlngs, {
        color: '#145142',
        fillColor: '#145142',
        fillOpacity: 0.12,
        weight: 2,
      }).addTo(m.draftG)
    }
  }, [draftPoints, mapReady])

  const saveZone = async () => {
    if (draftPoints.length < 3) {
      toast.error('Потрібно мінімум 3 точки на карті')
      return
    }
    if (!newZoneName.trim()) {
      toast.error('Введіть назву зони')
      return
    }
    const token = localStorage.getItem('token')
    if (!token) {
      toast.error('Потрібна авторизація')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/delivery-zones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newZoneName.trim(),
          color: newZoneColor,
          cityId,
          coordinates: JSON.stringify(draftPoints),
        }),
      })
      if (res.ok) {
        toast.success('Зону збережено')
        setDraftPoints([])
        setNewZoneName('')
        setDrawMode(false)
        await loadZones()
        onZonesChanged()
      } else {
        const e = (await res.json().catch(() => ({}))) as { message?: string }
        toast.error(e.message || 'Помилка збереження зони')
      }
    } catch {
      toast.error('Помилка мережі')
    } finally {
      setSaving(false)
    }
  }

  const deleteZone = async (id: number) => {
    if (!confirm('Видалити цю зону доставки?')) return
    const token = localStorage.getItem('token')
    if (!token) {
      toast.error('Потрібна авторизація')
      return
    }
    try {
      const res = await fetch(`/api/delivery-zones/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        toast.success('Зону видалено')
        await loadZones()
        onZonesChanged()
      } else {
        toast.error('Не вдалося видалити')
      }
    } catch {
      toast.error('Помилка мережі')
    }
  }

  return (
    <div className="mt-6 rounded-[16px] border-2 border-[#145142]/20 bg-white/90 p-4 sm:p-5">
      <h3 className="text-base font-bold text-[#145142]">Зони доставки на карті</h3>
      <p className="mt-1 text-xs text-gray-600">
        Увімкніть «Малювати зону», клікніть по карті мінімум 3 рази по периметру району, введіть назву й натисніть
        «Зберегти зону». Тариф (безкоштовно / фікс €) задається в блоці нижче для кожної зони.
      </p>
      {loading && !mapReady ? (
        <p className="mt-3 text-sm text-gray-500">Завантаження…</p>
      ) : null}
      <div
        ref={containerRef}
        className="mt-3 h-[min(420px,55vh)] w-full rounded-[12px] border border-[#145142]/20"
        aria-label="Карта зон доставки"
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setDrawMode((d) => !d)
            if (drawMode) setDraftPoints([])
          }}
          className={`rounded-[10px] px-3 py-2 text-xs font-bold sm:text-sm ${
            drawMode ? 'bg-[#c2410c] text-white' : 'bg-[#145142]/15 text-[#145142]'
          }`}
        >
          {drawMode ? 'Вимкнути малювання' : 'Малювати зону'}
        </button>
        <button
          type="button"
          onClick={() => setDraftPoints([])}
          className="rounded-[10px] border border-[#145142]/25 px-3 py-2 text-xs font-semibold text-[#145142] sm:text-sm"
        >
          Скинути точки ({draftPoints.length})
        </button>
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex-1 min-w-[140px]">
          <label className="block text-[10px] font-bold uppercase tracking-wide text-[#145142]/80">Назва зони</label>
          <input
            value={newZoneName}
            onChange={(e) => setNewZoneName(e.target.value)}
            className="mt-1 w-full rounded-[10px] border border-[#145142]/25 p-2 text-sm"
            placeholder="Напр. Центр"
          />
        </div>
        <div className="w-28">
          <label className="block text-[10px] font-bold uppercase tracking-wide text-[#145142]/80">Колір</label>
          <input
            type="color"
            value={newZoneColor}
            onChange={(e) => setNewZoneColor(e.target.value)}
            className="mt-1 h-9 w-full cursor-pointer rounded border border-[#145142]/25"
          />
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={() => void saveZone()}
          className="rounded-[10px] bg-[#145142] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#103d34] disabled:opacity-50"
        >
          {saving ? 'Збереження…' : 'Зберегти зону'}
        </button>
      </div>
      {zones.length > 0 && (
        <ul className="mt-4 space-y-2 border-t border-[#145142]/10 pt-3">
          {zones.map((z) => (
            <li
              key={z.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] bg-[#f7fbf9] px-3 py-2 text-sm"
            >
              <span className="font-semibold text-[#155044]">{z.name}</span>
              <button
                type="button"
                onClick={() => void deleteZone(z.id)}
                className="text-xs font-bold text-red-600 hover:underline"
              >
                Видалити
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
