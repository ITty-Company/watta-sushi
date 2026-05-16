'use client'

import { useEffect, useRef, useState } from 'react'

interface LogoPosition {
  x: number
  y: number
  rotation: number
  size: number
  opacity: number
}

export default function LogoBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [logos, setLogos] = useState<LogoPosition[]>([])

  useEffect(() => {
    if (!containerRef.current) return

    // Генерируем логотипы только один раз при монтировании
    if (logos.length > 0) return

    const generateLogos = () => {
      const container = containerRef.current
      if (!container) return

      const containerRect = container.getBoundingClientRect()
      const minSize = 60 // Минимальный размер логотипа (уменьшен для заполнения пустот)
      const maxSize = 200 // Максимальный размер логотипа
      const minGap = 30 // Минимальный зазор между логотипами
      const maxAttempts = 300 // Уменьшено для производительности
      
      // Оптимизированное количество логотипов для производительности (уменьшено для быстрой загрузки)
      const baseLogoCount = Math.floor((containerRect.width * containerRect.height) / (maxSize * maxSize * 1.2)) || 20
      const logoCount = Math.min(baseLogoCount, 12)
      
      const newLogos: LogoPosition[] = []
      const existingLogos: { x: number; y: number; size: number }[] = []

      // Функция для проверки расстояния между логотипами с учетом их размеров
      const checkDistance = (x: number, y: number, size: number): boolean => {
        for (const existing of existingLogos) {
          const distance = Math.sqrt(
            Math.pow(x - existing.x, 2) + Math.pow(y - existing.y, 2)
          )
          
          // Минимальное расстояние = сумма радиусов + минимальный зазор
          const minRequiredDistance = (size / 2) + (existing.size / 2) + minGap
          
          if (distance < minRequiredDistance) {
            return false
          }
        }
        return true
      }

      // Создаем более плотную сетку для лучшего заполнения
      const gridSpacing = Math.max(containerRect.width / 10, containerRect.height / 10)
      const gridPoints: { x: number; y: number }[] = []
      
      // Генерируем больше точек сетки с небольшими смещениями
      for (let i = 0; i <= Math.ceil(containerRect.width / gridSpacing); i++) {
        for (let j = 0; j <= Math.ceil(containerRect.height / gridSpacing); j++) {
          const baseX = i * gridSpacing
          const baseY = j * gridSpacing
          // Добавляем случайное смещение от сетки для более органичного вида
          const offsetX = (Math.random() - 0.5) * (gridSpacing * 0.5)
          const offsetY = (Math.random() - 0.5) * (gridSpacing * 0.5)
          gridPoints.push({ 
            x: baseX + offsetX, 
            y: baseY + offsetY 
          })
        }
      }

      // Перемешиваем точки сетки для случайного порядка размещения
      const shuffledPoints = [...gridPoints].sort(() => Math.random() - 0.5)
      
      // Размещаем логотипы на точках сетки
      for (let i = 0; i < logoCount; i++) {
        let placed = false
        let attempts = 0
        
        while (!placed && attempts < maxAttempts) {
          // Генерируем случайный размер для каждого логотипа
          // Предпочитаем меньшие размеры для заполнения пустот
          const sizeRandom = Math.random()
          const logoSize = sizeRandom < 0.6 
            ? Math.floor(Math.random() * (120 - minSize + 1)) + minSize // 60% меньших размеров
            : Math.floor(Math.random() * (maxSize - 120 + 1)) + 120 // 40% больших размеров
          
          let x: number, y: number
          
          if (i < shuffledPoints.length && shuffledPoints[i]) {
            // Используем точку сетки
            const point = shuffledPoints[i]
            x = Math.max(0, Math.min(point.x - logoSize / 2, containerRect.width - logoSize))
            y = Math.max(0, Math.min(point.y - logoSize / 2, containerRect.height - logoSize))
          } else {
            // Для дополнительных логотипов используем более умное размещение
            // Ищем области с меньшим количеством логотипов
            const maxX = containerRect.width - logoSize
            const maxY = containerRect.height - logoSize
            if (maxX <= 0 || maxY <= 0) break
            
            // Пробуем несколько случайных позиций и выбираем лучшую
            let bestX = 0
            let bestY = 0
            let bestDistance = 0
            
            for (let attempt = 0; attempt < 10; attempt++) {
              const testX = Math.random() * maxX
              const testY = Math.random() * maxY
              const testCenterX = testX + logoSize / 2
              const testCenterY = testY + logoSize / 2
              
              // Находим минимальное расстояние до ближайшего логотипа
              let minDist = Infinity
              for (const existing of existingLogos) {
                const dist = Math.sqrt(
                  Math.pow(testCenterX - existing.x, 2) + Math.pow(testCenterY - existing.y, 2)
                )
                minDist = Math.min(minDist, dist)
              }
              
              if (minDist > bestDistance) {
                bestDistance = minDist
                bestX = testX
                bestY = testY
              }
            }
            
            x = bestX
            y = bestY
          }
          
          const centerX = x + logoSize / 2
          const centerY = y + logoSize / 2
          
          if (checkDistance(centerX, centerY, logoSize)) {
            // Разные углы поворота для визуального интереса
            const rotation = (Math.random() - 0.5) * 50
            
            const baseOpacity = 0.025
            const sizeFactor = (logoSize - minSize) / (maxSize - minSize)
            const opacity = baseOpacity + (sizeFactor * 0.025)
            
            newLogos.push({ 
              x, 
              y, 
              rotation, 
              size: logoSize,
              opacity
            })
            existingLogos.push({ x: centerX, y: centerY, size: logoSize })
            placed = true
          }
          attempts++
        }
      }
      
      // Дополнительный проход для заполнения оставшихся пустот меньшими логотипами (оптимизировано)
      const additionalLogos = Math.floor(logoCount * 0.1) // Уменьшено до 10% для максимальной производительности
      for (let i = 0; i < additionalLogos; i++) {
        let placed = false
        let attempts = 0
        
        while (!placed && attempts < maxAttempts) {
          // Используем только меньшие размеры для заполнения пустот
          const logoSize = Math.floor(Math.random() * (100 - minSize + 1)) + minSize
          
          const maxX = containerRect.width - logoSize
          const maxY = containerRect.height - logoSize
          if (maxX <= 0 || maxY <= 0) break
          
          // Ищем лучшую позицию в пустых областях
          let bestX = 0
          let bestY = 0
          let bestDistance = 0
          
          for (let attempt = 0; attempt < 15; attempt++) {
            const testX = Math.random() * maxX
            const testY = Math.random() * maxY
            const testCenterX = testX + logoSize / 2
            const testCenterY = testY + logoSize / 2
            
            let minDist = Infinity
            for (const existing of existingLogos) {
              const dist = Math.sqrt(
                Math.pow(testCenterX - existing.x, 2) + Math.pow(testCenterY - existing.y, 2)
              )
              minDist = Math.min(minDist, dist)
            }
            
            if (minDist > bestDistance) {
              bestDistance = minDist
              bestX = testX
              bestY = testY
            }
          }
          
          const centerX = bestX + logoSize / 2
          const centerY = bestY + logoSize / 2
          
          if (checkDistance(centerX, centerY, logoSize)) {
            const rotation = (Math.random() - 0.5) * 50
            const opacity = 0.02 + Math.random() * 0.02 // Ледь помітні водяні знаки — без «плям»
            
            newLogos.push({ 
              x: bestX, 
              y: bestY, 
              rotation, 
              size: logoSize,
              opacity
            })
            existingLogos.push({ x: centerX, y: centerY, size: logoSize })
            placed = true
          }
          attempts++
        }
      }

      setLogos(newLogos)
    }

    // Генерируем логотипы после загрузки страницы для лучшей производительности
    const timeoutId = setTimeout(() => {
      if (logos.length === 0 && document.readyState === 'complete') {
        // Используем requestIdleCallback для генерации в свободное время
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => {
            generateLogos()
          }, { timeout: 2000 })
        } else {
          setTimeout(generateLogos, 500)
        }
      }
    }, 300)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [logos.length])

  useEffect(() => {
    // Оптимизированное обновление размеров с debounce
    let updateTimeout: ReturnType<typeof setTimeout> | null = null
    
    const updateSize = () => {
      if (!containerRef.current) return
      const container = containerRef.current
      const parent = container.parentElement
      if (!parent) return
      
      // Получаем полную высоту контента страницы
      const aboutContainer = document.getElementById('about-page-container')
      const containerHeight = aboutContainer 
        ? Math.max(aboutContainer.scrollHeight, aboutContainer.offsetHeight, aboutContainer.clientHeight)
        : 0
      
      const contentHeight = Math.max(
        containerHeight,
        parent.scrollHeight,
        parent.offsetHeight,
        document.documentElement.scrollHeight,
        window.innerHeight
      )
      
      // Устанавливаем высоту контейнера равной высоте контента
      container.style.height = `${contentHeight}px`
      container.style.minHeight = `${contentHeight}px`
    }
    
    // Debounced update function
    const debouncedUpdate = () => {
      if (updateTimeout) clearTimeout(updateTimeout)
      updateTimeout = setTimeout(updateSize, 150)
    }
    
    // Обновляем сразу
    updateSize()
    
    // Обновляем после небольших задержек
    const timeoutId = setTimeout(updateSize, 200)
    const timeoutId2 = setTimeout(updateSize, 500)
    
    window.addEventListener('resize', debouncedUpdate, { passive: true })
    
    // Используем ResizeObserver с debounce
    let resizeObserver: ResizeObserver | null = null
    if (containerRef.current?.parentElement && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(debouncedUpdate)
      resizeObserver.observe(containerRef.current.parentElement)
    }
    
    return () => {
      if (updateTimeout) clearTimeout(updateTimeout)
      clearTimeout(timeoutId)
      clearTimeout(timeoutId2)
      window.removeEventListener('resize', debouncedUpdate)
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
    }
  }, [])

  return (
    <div 
      ref={containerRef}
      className="watta-public-page-shell__bg absolute inset-0 overflow-hidden pointer-events-none"
      style={{ 
        zIndex: 0,
        minHeight: '100%',
        height: '100%',
        width: '100%',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      {logos.map((logo, index) => (
        <div
          key={index}
          className="absolute"
          style={{
            left: `${logo.x}px`,
            top: `${logo.y}px`,
            width: `${logo.size}px`,
            height: `${logo.size}px`,
            opacity: logo.opacity,
            transform: `rotate(${logo.rotation}deg)`,
            willChange: 'auto',
          }}
        >
          <img
            src="/logo.png"
            alt=""
            className="w-full h-full object-contain"
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            style={{
              willChange: 'auto',
              contentVisibility: 'auto'
            }}
          />
        </div>
      ))}
    </div>
  )
}
