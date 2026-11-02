import { describe, it, expect } from 'vitest'
import { findJourney, routeStopsCount } from './transit.js'

describe('transit', () => {
  it('findJourney returns matching routes', () => {
    const journeys = findJourney('Parada Biblioteca Principal', 'Parada Sede Norte')
    expect(journeys).toEqual([])
  })

  it('routeStopsCount counts segment stops', () => {
    const route = { stops: ['A', 'B', 'C', 'D'] }
    expect(routeStopsCount(route, 'B', 'D')).toBe(3)
  })

  it('findJourney returns empty when no route', () => {
    expect(findJourney('NoExiste', 'Tampoco')).toEqual([])
  })
})
