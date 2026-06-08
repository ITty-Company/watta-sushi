'use client'

import { useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'
import { useLanguage } from '../context/LanguageContext'

type WattaMenuBalloonsTriggerProps = {
  placement?: 'hero' | 'catalog'
}

/**
 * Кожна хвиля шариків живе ~25–30с і додає десятки анімованих SVG-вузлів з
 * важкими blur-фільтрами (важко для GPU). Кнопку можна жати скільки завгодно,
 * але щоб вона не «вішала» сторінку при спамі кліків, ми:
 *   1) тримаємо на екрані максимум MAX_CONCURRENT_BALLOON_WAVES хвиль — найстаріші
 *      прибираємо перед запуском нової;
 *   2) коалесюємо спам коротким кулдауном (перший клік — миттєвий, далі не частіше
 *      ніж раз на LAUNCH_COOLDOWN_MS, інакше десятки хвиль накопичуються й кладуть FPS);
 *   3) знімаємо найважчий повноекранний blur(8px) з передніх шариків одразу після
 *      вставки — він найбільше «їсть» GPU, а на загальну картинку майже не впливає.
 */
const MAX_CONCURRENT_BALLOON_WAVES = 2
const LAUNCH_COOLDOWN_MS = 550

export default function WattaMenuBalloonsTrigger({
  placement = 'hero',
}: WattaMenuBalloonsTriggerProps) {
  // Лок тримаємо лише на час першого (lazy) import — захист від дабл-кліку, поки
  // модуль ще вантажиться. Далі він миттєвий, і ритм задає кулдаун.
  const importLockRef = useRef(false)
  const lastLaunchRef = useRef(0)
  const { t } = useLanguage()
  const mv = t.menuView

  const handleLaunch = useCallback(() => {
    if (typeof document === 'undefined') return
    if (importLockRef.current) return

    const now = Date.now()
    if (now - lastLaunchRef.current < LAUNCH_COOLDOWN_MS) return
    lastLaunchRef.current = now

    importLockRef.current = true
    void import('balloons-js')
      .then(({ balloons }) => {
        // Прибираємо найстаріші хвилі ДО запуску нової, щоб одночасно на екрані
        // не висіло більше за ліміт (кожна хвиля летить ~30с).
        const waves = document.querySelectorAll('balloons')
        const removeCount = waves.length - (MAX_CONCURRENT_BALLOON_WAVES - 1)
        for (let i = 0; i < removeCount; i += 1) waves[i]?.remove()

        // Запускаємо ефект і НЕ чекаємо кінця польоту: інакше кнопка «залипає».
        void balloons()

        // balloons() синхронно вставляє <balloons> з усіма <balloon>. Одразу
        // знімаємо повноекранний blur(8px) з передніх шариків — це найдорожчий
        // для GPU шар і головна причина просідань FPS.
        const freshWaves = document.querySelectorAll('balloons')
        const fresh = freshWaves[freshWaves.length - 1]
        fresh?.querySelectorAll<HTMLElement>('balloon').forEach((balloon) => {
          if (balloon.style.filter && balloon.style.filter !== 'none') {
            balloon.style.filter = 'none'
          }
        })
      })
      .finally(() => {
        importLockRef.current = false
      })
  }, [])

  const isHero = placement === 'hero'

  return (
    <div
      className={cn(
        'watta-menu-balloons-trigger-wrap flex justify-center',
        isHero
          ? 'watta-menu-balloons-trigger-wrap--under-copy pointer-events-none w-full px-0'
          : 'mb-4 sm:mb-5',
      )}
    >
      <button
        type="button"
        className={cn('watta-menu-balloons-cta', isHero && 'pointer-events-auto')}
        onClick={handleLaunch}
        aria-label={mv.fullMenuBalloonsAria}
      >
        <span className="watta-menu-balloons-cta__label">
          <span className="watta-menu-balloons-cta__label-ink" aria-hidden>
            {mv.fullMenuBalloonsBtn}
          </span>
          <span className="watta-menu-balloons-cta__label-base">{mv.fullMenuBalloonsBtn}</span>
        </span>
        <svg width="15" height="10" viewBox="0 0 13 10" aria-hidden>
          <path d="M1,5 L11,5" />
          <polyline points="8 1 12 5 8 9" />
        </svg>
      </button>
    </div>
  )
}
