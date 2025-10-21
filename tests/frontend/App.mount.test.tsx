import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'
import App from '../../App'

describe('App', () => {
  it('mounts without crashing', () => {
    const { getByTestId } = render(<App />)
    // Settings panel is always rendered
    expect(getByTestId('game-settings')).toBeInTheDocument()
  })
})


