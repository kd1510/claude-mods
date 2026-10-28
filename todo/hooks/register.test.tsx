import { expect, test } from 'claude-code/testing'
import type { On } from 'claude-code'

const PANE = {
  plugin: 'todo',
  component: 'Pane',
  requestId: 'todo',
  props: {
    title: 'Todo',
    isFocused: false,
    bodyColumns: 40,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 20 },
    view: {},
  },
} as const

function standInForEngine(on: On) {
  on('command.register', () => ({ value: { command: 'todo' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('store.get', () => ({ value: undefined }))
  on('store.set', () => ({ value: undefined }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
}

test('typing in the pane adds an item, which can be ticked and removed', async ($, on) => {
  standInForEngine(on)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })

  expect((await ui.find({ type: 'Text', text: /Nothing to do/ }))?.text).toBe('Nothing to do.')

  await $.ui.input({ plugin: 'todo', key: 'new', text: 'buy milk' })
  expect((await ui.find({ type: 'Text', text: /buy milk/ }))?.text).toBe('buy milk')

  await $.ui.press({ plugin: 'todo', key: 'toggle-1' })
  expect(await ui.find({ type: 'Button', key: 'clear-done' })).toBeTruthy()

  await $.ui.press({ plugin: 'todo', key: 'delete-1' })
  expect(await ui.find({ type: 'Text', text: /buy milk/ })).toBeUndefined()
  await ui.unmount()
})

test('/todo <text> adds an item', async ($, on) => {
  standInForEngine(on)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })

  const ran = await $.command.run({
    command: 'todo',
    args: ' write tests ',
    origin: { kind: 'composer' },
    presentation: { isFullscreen: false, columns: 120 },
  })
  expect(ran.text).toBe('Added todo: write tests')

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect((await ui.find({ type: 'Text', text: /write tests/ }))?.text).toBe('write tests')
  await ui.unmount()
})

test('a surface without Input points at the command', async ($, on) => {
  standInForEngine(on)
  await $.session.start({ cwd: '/', surface: 'mobile', isInteractive: true })
  const ui = await $.ui.mount({ ...PANE, surface: 'mobile' })

  expect(await ui.find({ type: 'Text', text: /\/todo/ })).toBeTruthy()
  await ui.unmount()
})
