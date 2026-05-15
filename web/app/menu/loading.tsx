import WattaAppRouteLoading from '../components/WattaAppRouteLoading'

/** Лише сегмент `/menu` — без кореневого `app/loading.tsx`, щоб головна `/` не блимала сплешем. */
export default function MenuLoading() {
  return <WattaAppRouteLoading />
}
