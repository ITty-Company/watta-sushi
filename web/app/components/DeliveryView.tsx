'use client'

import { useState, useEffect } from 'react'

interface City {
  id: string
  name: string
  coordinates: { lat: number; lng: number }
  zoom: number
  deliveryZones: DeliveryZone[]
}

interface DeliveryZone {
  id: string
  name: string
  color: string
  coordinates: { lat: number; lng: number }[]
}

const defaultCities: City[] = [
  {
    id: 'amsterdam',
    name: 'Амстердам',
    coordinates: { lat: 52.3676, lng: 4.9041 },
    zoom: 11,
    deliveryZones: [
      {
        id: 'amsterdam-center',
        name: 'Центр',
        color: '#4ade80',
        coordinates: [
          { lat: 52.36, lng: 4.88 },
          { lat: 52.38, lng: 4.88 },
          { lat: 52.38, lng: 4.92 },
          { lat: 52.36, lng: 4.92 }
        ]
      }
    ]
  },
  {
    id: 'rotterdam',
    name: 'Роттердам',
    coordinates: { lat: 51.9244, lng: 4.4777 },
    zoom: 12,
    deliveryZones: []
  },
  {
    id: 'den-haag',
    name: 'Гаага',
    coordinates: { lat: 52.0705, lng: 4.3007 },
    zoom: 12,
    deliveryZones: []
  },
  {
    id: 'utrecht',
    name: 'Утрехт',
    coordinates: { lat: 52.0907, lng: 5.1214 },
    zoom: 12,
    deliveryZones: []
  },
  {
    id: 'eindhoven',
    name: 'Эйндховен',
    coordinates: { lat: 51.4416, lng: 5.4697 },
    zoom: 12,
    deliveryZones: []
  }
]

// Функция для генерации URL карты со всеми городами Нидерландов с маркерами
const getNetherlandsMapUrl = (cities: City[]) => {
  if (cities.length === 0) {
    return `https://www.google.com/maps?q=Netherlands&output=embed&z=8`
  }
  
  // Создаем маркеры в формате для Google Maps
  // Формат: color:red|label:буква|lat,lng|color:red|label:буква|lat,lng|...
  const markers = cities.map((city, index) => {
    const { lat, lng } = city.coordinates
    const label = String.fromCharCode(65 + (index % 26)) // A, B, C, D, E...
    return `color:red|label:${label}|${lat},${lng}`
  }).join('|')
  
  // URL с маркерами (один параметр markers со всеми маркерами)
  return `https://www.google.com/maps?q=Netherlands&output=embed&z=8&markers=${encodeURIComponent(markers)}`
}

// Функция для генерации URL карты для конкретного города
const getCityMapUrl = (city: City) => {
  const cityName = encodeURIComponent(city.name + ', Netherlands')
  return `https://www.google.com/maps?q=${cityName}&output=embed`
}

export default function DeliveryView() {
  const [selectedCity, setSelectedCity] = useState<City>(defaultCities[0])
  const [cities, setCities] = useState<City[]>(defaultCities)
  const [showAllCities, setShowAllCities] = useState(true) // По умолчанию показываем все города

  useEffect(() => {
    if (typeof window === 'undefined') return
    // Загружаем сохраненные зоны доставки из localStorage
    if (window.localStorage) {
      const savedZones = localStorage.getItem('deliveryZones')
      if (savedZones) {
        try {
          const parsed = JSON.parse(savedZones)
          setCities(parsed)
          const currentCity = parsed.find((c: City) => c.id === selectedCity.id)
          if (currentCity) {
            setSelectedCity(currentCity)
          }
        } catch (e) {
          console.error('Error loading delivery zones:', e)
        }
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      // Сохраняем зоны доставки в localStorage
      localStorage.setItem('deliveryZones', JSON.stringify(cities))
    }
  }, [cities])

  const handleCityChange = (cityId: string) => {
    const city = cities.find(c => c.id === cityId)
    if (city) {
      setSelectedCity(city)
      setShowAllCities(false) // При выборе города показываем только его карту
    }
  }

  const handleShowAllCities = () => {
    setShowAllCities(true)
  }

  const handleAddZone = () => {
    const zoneName = prompt('Введіть назву зони доставки:')
    if (!zoneName) return

    const colors = ['#4ade80', '#60a5fa', '#f59e0b', '#ef4444', '#a78bfa', '#ec4899']
    const randomColor = colors[Math.floor(Math.random() * colors.length)]

    const newZone: DeliveryZone = {
      id: `zone-${Date.now()}`,
      name: zoneName,
      color: randomColor,
      coordinates: []
    }

    const updatedCities = cities.map(city => {
      if (city.id === selectedCity.id) {
        return {
          ...city,
          deliveryZones: [...city.deliveryZones, newZone]
        }
      }
      return city
    })

    setCities(updatedCities)
    setSelectedCity(updatedCities.find(c => c.id === selectedCity.id)!)
  }

  const handleDeleteZone = (zoneId: string) => {
    if (!confirm('Ви впевнені, що хочете видалити цю зону?')) return

    const updatedCities = cities.map(city => {
      if (city.id === selectedCity.id) {
        return {
          ...city,
          deliveryZones: city.deliveryZones.filter(z => z.id !== zoneId)
        }
      }
      return city
    })

    setCities(updatedCities)
    setSelectedCity(updatedCities.find(c => c.id === selectedCity.id)!)
  }


  return (
    <div className="delivery-content-wrapper-web">
      {/* Заголовок страницы */}
      <div className="delivery-header-section-web">
        <h1 className="delivery-page-title-web">Всі наші міста де працює доставка</h1>
      </div>

      {/* Выбор города */}
      <div className="cities-selector-web">
        {cities.map(city => (
          <button
            key={city.id}
            className={`city-btn-web ${selectedCity.id === city.id ? 'active' : ''}`}
            onClick={() => handleCityChange(city.id)}
          >
            <span className="city-icon-web">📍</span>
            <span className="city-name-web">{city.name}</span>
            {city.deliveryZones.length > 0 && (
              <span className="city-zones-badge-web">{city.deliveryZones.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Карта доставки */}
      <div className="delivery-map-container-web">
        <div className="map-controls-web">
          <button
            className={`map-view-btn-web ${showAllCities ? 'active' : ''}`}
            onClick={handleShowAllCities}
          >
            🗺️ Всі міста
          </button>
          <button
            className={`map-view-btn-web ${!showAllCities ? 'active' : ''}`}
            onClick={() => {
              setShowAllCities(false)
            }}
          >
            📍 {selectedCity.name}
          </button>
        </div>
        <div className="delivery-map-web">
          <iframe
            key={showAllCities ? 'all-cities' : selectedCity.id}
            src={showAllCities ? getNetherlandsMapUrl(cities) : getCityMapUrl(selectedCity)}
            width="100%"
            height="600"
            style={{ border: 0, borderRadius: '12px', display: 'block' }}
            allowFullScreen={true}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={showAllCities ? 'Карта доставки - Всі міста' : `Карта доставки - ${selectedCity.name}`}
          ></iframe>
          {/* Fallback если карта не загрузилась */}
          <div className="map-fallback-web" style={{ display: 'none' }}>
            <a 
              href={showAllCities 
                ? 'https://www.google.com/maps/search/Netherlands'
                : `https://www.google.com/maps/search/${encodeURIComponent(selectedCity.name + ', Netherlands')}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="map-link-web"
            >
              Відкрити карту в Google Maps
            </a>
          </div>
          {/* Админ панель для управления зонами доставки */}
          <div className="admin-panel-overlay-web">
            <div className="admin-panel-web">
              <div className="admin-panel-header-web">
                <h3>Управління зонами доставки</h3>
              </div>
              <div className="admin-panel-content-web">
                <p>Місто: <strong>{selectedCity.name}</strong></p>
                <p>Зон доставки: <strong>{selectedCity.deliveryZones.length}</strong></p>
                <button 
                  className="add-zone-btn-web"
                  onClick={handleAddZone}
                >
                  ➕ Додати зону доставки
                </button>
                {selectedCity.deliveryZones.length > 0 && (
                  <div className="admin-zone-list-web">
                    {selectedCity.deliveryZones.map(zone => (
                      <div key={zone.id} className="admin-zone-item-web">
                        <div 
                          className="zone-color-box-web" 
                          style={{ backgroundColor: zone.color }}
                        ></div>
                        <span>{zone.name}</span>
                        <button 
                          className="delete-zone-btn-web"
                          onClick={() => handleDeleteZone(zone.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Информация о зонах доставки */}
      {selectedCity.deliveryZones.length > 0 && (
        <div className="delivery-zones-info-web">
          <h3 className="zones-info-title-web">Зони доставки в {selectedCity.name}</h3>
          <div className="zones-grid-web">
            {selectedCity.deliveryZones.map(zone => (
              <div 
                key={zone.id} 
                className="zone-card-web"
                style={{ borderLeftColor: zone.color }}
              >
                <div 
                  className="zone-color-badge-web"
                  style={{ backgroundColor: zone.color }}
                ></div>
                <h4>{zone.name}</h4>
                <p>Доставка доступна</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Условия доставки */}
      <div className="delivery-conditions-web">
        <div className="delivery-conditions-content-web">
          <div className="delivery-conditions-text-web">
            <h3 className="delivery-conditions-title-web">Умови доставки</h3>
            <p className="delivery-conditions-desc-web">
              Мінімальна сума замовлення 700 грн.
            </p>
            <p className="delivery-conditions-desc-web">
              Подробиці доставки до віддалених районів уточнюйте в оператора.
            </p>
          </div>
          <div className="delivery-working-hours-web">
            <h3 className="working-hours-title-web">Час роботи:</h3>
            <div className="working-hours-header-web">
              <div className="working-hours-icon-web">🕐</div>
              <span className="working-hours-time-web">з 11:00 до 22:30</span>
            </div>
          </div>
        </div>
      </div>

      {/* Как сделать заказ */}
      <div className="how-to-order-section-web">
        <h2 className="how-to-order-title-web">Як зробити замовлення?</h2>
        <div className="how-to-order-grid-web">
          <div className="how-to-order-card-web">
            <div className="how-to-order-icon-web">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ff6b35" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </div>
            <p className="how-to-order-text-web">На сайті</p>
          </div>
          
          <div className="how-to-order-card-web">
            <div className="how-to-order-icon-web">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ff6b35" strokeWidth="2">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                <line x1="12" y1="18" x2="12.01" y2="18"/>
              </svg>
            </div>
            <p className="how-to-order-text-web">У мобільному застосунку</p>
          </div>
          
          <div className="how-to-order-card-web">
            <div className="how-to-order-icon-web">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ff6b35" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </div>
            <p className="how-to-order-text-web">По телефону</p>
          </div>
        </div>
      </div>
    </div>
  )
}
