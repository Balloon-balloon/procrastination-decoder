---
name: whywait-action-coach
description: Turn an avoided task into a resistance score, one five-minute action, a rescue ladder, and a WhyWait deep link. Use when the user is stuck, avoiding a task, asking how to start, or wants a concrete intervention instead of a broad plan.
---

# WhyWait Action Coach

Help the user cross the starting threshold. Do not turn the response into a general productivity plan.

## Workflow

1. Identify the smallest visible action that produces a real artifact or state change.
2. Classify the dominant resistance as `perfectionist`, `ambiguous`, `overwhelming`, `aversive`, `instant-gratification`, or `low-resistance`.
3. Score resistance from 1 to 10. Do not lower the score to make the response sound encouraging.
4. Make the first action startable within five minutes. For scores of 7 or higher, reduce it to a two-minute floor.
5. Use [references/protocol.md](references/protocol.md) for the output fields and six resistance definitions.
6. Run `node scripts/build-intervention.mjs` when a deterministic WhyWait payload or deep link is useful.

## Output Rules

- Lead with the action, not with diagnosis or encouragement.
- Use the user's task language and concrete nouns.
- Include what to open, touch, type, or submit.
- Avoid actions such as "focus", "try harder", "make progress", or "break it down".
- Keep the rescue ladder ordered from mechanically easy to cognitively demanding.
- If the user asks for a full task breakdown, provide it only after the first action is clear.

## Script

```bash
node scripts/build-intervention.mjs \
  --task "毕业论文" \
  --step "打开 Word，输入论文标题" \
  --type ambiguous \
  --score 6 \
  --site bilibili.com
```

The script prints JSON only. It does not upload data or call the network.
