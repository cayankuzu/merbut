import { fireEvent, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { usePerformanceStore } from '../store/performanceStore'
import { GraphicsSettingsPanel } from './GraphicsSettingsPanel'

describe('GraphicsSettingsPanel', () => {
  beforeEach(() => {
    usePerformanceStore.setState({
      preference: 'auto',
      tier: 'balanced',
      hardwareTier: 'balanced',
      fps: 60,
      p95FrameMs: 16.7,
      longFrames: 0,
      qualityFactor: 1,
      renderDpr: 1.15,
    })
  })

  it('shows hardware guidance from low through ultra quality', () => {
    render(createElement(GraphicsSettingsPanel))

    expect(screen.getByRole('radio', { name: /DÜŞÜK/ })).toBeVisible()
    expect(screen.getByRole('radio', { name: /ULTRA/ })).toBeVisible()
    expect(screen.getByText(/RTX 2060, RX 6600 veya Apple M1\+/)).toBeVisible()
  })

  it('turns an ultra selection into a persistent manual preference', () => {
    render(createElement(GraphicsSettingsPanel))
    const ultra = screen.getByRole('radio', { name: /ULTRA/ })

    fireEvent.click(ultra)

    expect(ultra).toBeChecked()
    expect(usePerformanceStore.getState()).toMatchObject({ preference: 'high', tier: 'high' })
  })
})
