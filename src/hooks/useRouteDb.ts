import { useState, useEffect } from 'react'
import { fetchEtaDb } from 'hk-bus-eta'
import type { EtaDb } from 'hk-bus-eta'
import type { RouteBoundMap, RouteListEntry } from '../types'
import { getRouteType } from '../utils'

export function useRouteDb() {
  const [etaDb, setEtaDb] = useState<EtaDb | null>(null)
  const [routeMap, setRouteMap] = useState<RouteBoundMap>({})
  const [routeEntries, setRouteEntries] = useState<RouteListEntry[]>([])
  const [isRouteDbLoading, setIsRouteDbLoading] = useState(true)
  const [routeDbError, setRouteDbError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadDb() {
      try {
        const db: EtaDb = await fetchEtaDb()
        if (cancelled) return

        setEtaDb(db)

        const map: RouteBoundMap = {}
        const entries: RouteListEntry[] = []

        for (const [routeId, meta] of Object.entries(db.routeList)) {
          const routeNumber = meta.route.trim()
          if (!routeNumber) continue

          const normalizedRoute = routeNumber.toUpperCase()
          const companyCodes = Array.isArray(meta.co) ? meta.co.map((code) => code.toLowerCase()) : []
          const routeType = getRouteType(companyCodes[0], normalizedRoute)

          const labelZh = `${meta.orig.zh} → ${meta.dest.zh}`
          const labelEn = `${meta.orig.en} → ${meta.dest.en}`
          if (!map[routeNumber]) {
            map[routeNumber] = []
          }
          map[routeNumber].push({ routeId, labelZh, labelEn })

          entries.push({
            routeId,
            route: routeNumber,
            serviceType: meta.serviceType ?? '1',
            companyCodes,
            routeType,
            origZh: meta.orig.zh,
            destZh: meta.dest.zh,
            origEn: meta.orig.en,
            destEn: meta.dest.en,
          })
        }

        Object.values(map).forEach((bounds) => {
          bounds.sort((a, b) => {
            const c = a.labelZh.localeCompare(b.labelZh)
            return c !== 0 ? c : a.routeId.localeCompare(b.routeId)
          })
        })

        setRouteMap(map)
        setRouteEntries(
          entries.sort((a, b) => {
            if (a.route === b.route) {
              return a.origEn.localeCompare(b.origEn)
            }
            return a.route.localeCompare(b.route, undefined, { numeric: true })
          }),
        )
        setRouteDbError(null)
      } catch (error) {
        console.error('Failed to load route database from hk-bus-eta', error)
        setRouteDbError(
          'Unable to load official route list. You can still type route and bound manually.',
        )
      } finally {
        if (!cancelled) {
          setIsRouteDbLoading(false)
        }
      }
    }

    loadDb()

    return () => {
      cancelled = true
    }
  }, [])

  return { etaDb, routeMap, routeEntries, isRouteDbLoading, routeDbError }
}
