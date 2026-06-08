/**
 * Ленивый набор фич для framer-motion `LazyMotion`.
 *
 * `m` (легкий компонент) грузится в основном бандле, а тяжелый движок анимаций
 * (`domMax` — включает whileInView / whileHover / whileTap / drag / AnimatePresence)
 * подтягивается отдельным async-чанком ПОСЛЕ первого рендера. Это убирает движок
 * с критического пути загрузки каждой публичной страницы.
 *
 * Использование: <LazyMotion features={loadFramerFeatures} /> + только `m.*` (не `motion.*`).
 */
export const loadFramerFeatures = () =>
  import('framer-motion').then((mod) => mod.domMax)
