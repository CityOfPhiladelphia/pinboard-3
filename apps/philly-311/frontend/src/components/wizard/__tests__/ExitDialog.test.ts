// ABOUTME: Tests for ExitDialog — verifies save/discard/cancel emit the right
// ABOUTME: events and that the native dialog close event also closes it.
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ExitDialog from '../ExitDialog.vue'

describe('ExitDialog', () => {
  it('emits save and closes when the save button is clicked', async () => {
    const w = mount(ExitDialog, { props: { open: true } })
    await w.find('[data-test="exit-save"]').trigger('click')
    expect(w.emitted('save')).toHaveLength(1)
    expect(w.emitted('update:open')?.[0]).toEqual([false])
    expect(w.emitted('discard')).toBeUndefined()
  })

  it('emits discard and closes when the discard button is clicked', async () => {
    const w = mount(ExitDialog, { props: { open: true } })
    await w.find('[data-test="exit-discard"]').trigger('click')
    expect(w.emitted('discard')).toHaveLength(1)
    expect(w.emitted('update:open')?.[0]).toEqual([false])
    expect(w.emitted('save')).toBeUndefined()
  })

  it('emits only update:open when cancel is clicked', async () => {
    const w = mount(ExitDialog, { props: { open: true } })
    await w.find('[data-test="exit-cancel"]').trigger('click')
    expect(w.emitted('update:open')?.[0]).toEqual([false])
    expect(w.emitted('save')).toBeUndefined()
    expect(w.emitted('discard')).toBeUndefined()
  })

  it('emits update:open false when the dialog is natively closed', async () => {
    const w = mount(ExitDialog, { props: { open: true } })
    await w.find('dialog').trigger('close')
    expect(w.emitted('update:open')?.[0]).toEqual([false])
  })
})
