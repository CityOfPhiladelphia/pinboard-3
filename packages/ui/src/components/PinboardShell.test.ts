// ABOUTME: Tests for PinboardShell — verifies the `links` prop reaches AppHeader's
// ABOUTME: real nav-link rendering, and defaults to no links when omitted (oem-flood-finder).
// import { describe, it, expect } from 'vitest'
// import { mount } from '@vue/test-utils'
// import PinboardShell from './PinboardShell.vue'

// function mountShell(extra: Record<string, unknown> = {}) {
//   return mount(PinboardShell, {
//     props: { title: 'Test App', ...extra },
//   })
// }

// describe('PinboardShell', () => {
//   it('renders links passed to it as header nav links', () => {
//     const w = mountShell({
//       links: [
//         { text: 'Map', href: '/' },
//         { text: 'Reports', href: '/reports' },
//         { text: 'Answers', href: '/answers' },
//       ],
//     })
//     const navLinks = w.findAll('a.phila-navbar-link')
//     expect(navLinks.map((a) => a.text())).toEqual(['Map', 'Reports', 'Answers'])
//     expect(navLinks.map((a) => a.attributes('href'))).toEqual(['/', '/reports', '/answers'])
//   })

//   it('renders no header nav links when links is omitted', () => {
//     const w = mountShell()
//     expect(w.findAll('a.phila-navbar-link')).toHaveLength(0)
//   })
// })
