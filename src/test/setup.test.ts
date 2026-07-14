import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

describe('Smoke Test', () => {
  it('renders a simple component and verifies it exists in the DOM', () => {
    render(React.createElement('div', null, 'Bundestagswahl 2025'))
    expect(screen.getByText('Bundestagswahl 2025')).toBeInTheDocument()
  })
})
