import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { TodoItem } from '../types'

const PANE = 'todo'
const PANE_TITLE = 'Todo'
const COMMAND = 'todo'
const STORE_KEY = 'items'
const HEADER_ROWS = 4
const DEFAULT_PANE_ROWS = 24

const items = atom({ plugin: 'todo', key: 'items' } as const, [])
const draft = atom({ plugin: 'todo', key: 'draft' } as const, '')

async function changeItems(
  $: Pick<EngineInterface, 'state' | 'store'>,
  change: (list: TodoItem[]) => TodoItem[],
): Promise<void> {
  const changed = await update($, items, change)
  await $.store.set(STORE_KEY, changed)
}

function withNewItem(list: TodoItem[], text: string): TodoItem[] {
  const nextId = Math.max(0, ...list.map(item => item.id)) + 1

  return [...list, { id: nextId, text, isDone: false }]
}

function toggled(list: TodoItem[], id: number): TodoItem[] {
  return list.map(item => (item.id === id ? { ...item, isDone: !item.isDone } : item))
}

function without(list: TodoItem[], id: number): TodoItem[] {
  return list.filter(item => item.id !== id)
}

function pending(list: TodoItem[]): TodoItem[] {
  return list.filter(item => !item.isDone)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const stored = await $.store.get(STORE_KEY)
    await update($, items, () => (Array.isArray(stored) ? (stored as TodoItem[]) : []))
    await $.command.register({
      name: COMMAND,
      description: 'Open the todo pane, or add an item: /todo <text>',
    })
    void $.ui.open({ id: PANE, title: PANE_TITLE })

    return next(e)
  })

  on('command.run', { command: COMMAND }, async ($, e) => {
    const text = e.args.trim()
    await $.ui.open({ id: PANE, title: PANE_TITLE })
    if (text === '') {
      return { text: 'Todo pane opened.' }
    }
    try {
      await changeItems($, list => withNewItem(list, text))
    } catch (error) {
      return { text: `Could not add todo: ${String(error)}` }
    }

    return { text: `Added todo: ${text}` }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const list = await read($, items)
    const typed = await read($, draft)
    const room = Math.max(1, (e.viewport?.rows ?? DEFAULT_PANE_ROWS) - HEADER_ROWS)
    const doneCount = list.length - pending(list).length

    const addItem = async (value: string) => {
      const text = value.trim()
      if (text === '') {
        return
      }
      await changeItems($, current => withNewItem(current, text))
      await update($, draft, () => '')
    }

    let newItemField
    if (e.surface === 'mobile') {
      newItemField = <Text dimColor>{'Add items with /todo <text>'}</Text>
    } else {
      const { Input } = $.ui.resolve(e)
      newItemField = (
        <Input
          key="new"
          placeholder="Add a todo…"
          submitLabel="add"
          value={typed}
          autoFocus
          onInput={value => void update($, draft, () => value)}
          onSubmit={value => void addItem(value)}
        />
      )
    }

    return (
      <Box flexDirection="column">
        {newItemField}
        {list.length === 0 && <Text dimColor>Nothing to do.</Text>}
        {list.slice(0, room).map(item => (
          <Box flexDirection="row" gap={1}>
            <Button
              key={`toggle-${item.id}`}
              plain
              label={item.isDone ? '[x]' : '[ ]'}
              onPress={() => void changeItems($, current => toggled(current, item.id))}
            />
            <Box flexGrow={1}>
              <Text dimColor={item.isDone} strikethrough={item.isDone}>
                {item.text}
              </Text>
            </Box>
            <Button
              key={`delete-${item.id}`}
              plain
              dimColor
              label="✕"
              onPress={() => void changeItems($, current => without(current, item.id))}
            />
          </Box>
        ))}
        {list.length > room && <Text dimColor>…and {list.length - room} more</Text>}
        {doneCount > 0 && (
          <Button
            key="clear-done"
            dimColor
            label={`Clear ${doneCount} done`}
            onPress={() => void changeItems($, pending)}
          />
        )}
      </Box>
    )
  })
}
