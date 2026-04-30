import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import HomePage from '../page'

describe('HomePage component (unit render)', () => {
  beforeEach(() => {
    jest.resetModules()
    // Mock next/image to a simple img for server-side rendering
    jest.doMock('next/image', () => ({
      __esModule: true,
      default: (props: any) =>
        React.createElement('img', { src: props.src, alt: props.alt, className: props.className }),
    }))

    // Mock next/link to a simple anchor
    jest.doMock('next/link', () => ({
      __esModule: true,
      default: ({ children, href, ...rest }: any) =>
        React.createElement('a', { href, ...rest }, children),
    }))
  })

  it('renders main home page elements', () => {
    const html = renderToStaticMarkup(React.createElement(HomePage))

    expect(html).toContain('Твоята София')
    expect(html).toContain('Изтеглете приложението')
    expect(html).toContain('Градски новини')
    expect(html).toContain('Интерактивна карта')
    expect(html).toContain('Докладвайте проблеми')
    expect(html).toContain('App Store')
  })
})
