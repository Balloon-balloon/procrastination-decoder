# Intervention Protocol

## Resistance Types

- `perfectionist`: the user fears producing something inadequate.
- `ambiguous`: the next action is not concrete.
- `overwhelming`: the task appears too large to finish.
- `aversive`: the task is boring, unpleasant, or feels meaningless.
- `instant-gratification`: a more rewarding activity is immediately available.
- `low-resistance`: the task is mechanical and only needs a clear cue.

## JSON Fields

- `taskTitle`: short task name.
- `resistanceType`: one value from the list above.
- `resistanceScore`: integer from 1 to 10.
- `microStep`: the first visible action, no more than five minutes.
- `twoMinuteFloor`: fallback action for high resistance.
- `rescueLadder`: three to five actions ordered by increasing cognitive load.
- `deepLink`: WhyWait rescue page with `task`, `step`, and `source` query parameters.
- `deviceCommand`: deterministic state for the Action Companion or M5StickC device.

## Companion States

`idle -> observing -> prompted -> focusing -> rescued -> completed`

The `rescued` state must replace the current action with a smaller one. It must not repeat the same prompt.
