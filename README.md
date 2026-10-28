# claude-mods

Mods for [Claude Code](https://claude.com/claude-code): small plugins that change its interface and behaviour.
This repository is a plugin marketplace; each mod lives in its own folder.

## Mods

### todo

A todo list in a side pane beside the chat. The list is saved between sessions.

- The **Todo** pane opens when a session starts (once the terminal is wide enough), or on demand with `/todo`.
- Add an item by typing in the field at the top of the pane and pressing Enter, or with `/todo <text>` from the prompt.
- `[ ]` / `[x]` ticks an item off, `✕` deletes it, and **Clear N done** removes every finished item.
- On the mobile app, which draws no text fields, add items with `/todo <text>`.

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install todo --marketplace kd1510/claude-mods
```

Answer `y` to add the marketplace, then pick a scope (user scope loads it in every session).

From a shell:

```
claude plugin install todo --marketplace kd1510/claude-mods
```

In the desktop app, where `/plugin` does not run: click **+** next to the prompt box, then **Plugins**, **Add marketplace** with `kd1510/claude-mods`, then **Add plugin**.

## Developing

Run a mod from a local checkout with `claude --plugin-dir ./todo`; saving a file reloads it.
Run its tests with `claude plugin test ./todo` and check it with `claude plugin validate ./todo`.

## License

MIT
