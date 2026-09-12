# WhyWait Action Companion

Action Companion 是 WhyWait 的实体行动入口。网页负责生成低阻力动作，设备负责在现实世界中提供按钮、灯光和振动反馈。

## 最小硬件

- ESP32-C3、ESP32-S3 或 M5StickC Plus2
- 一个实体按钮
- 一个振动马达或蜂鸣器
- 一个 RGB LED
- 500mAh 以上锂电池
- 可选：0.96 英寸 OLED 或 1.14 英寸 TFT

建议先用 M5StickC Plus2 验证交互，再自行制作 ESP32 小板。

## 状态机

`idle -> observing -> prompted -> focusing -> rescued -> completed`

- `observing`：浏览器持续检测逃避行为，不立即提醒。
- `prompted`：屏幕上出现一个五分钟微行动。
- `focusing`：用户按下实体按钮，网页同步开始计时。
- `rescued`：用户长按按钮，当前动作被替换成更小的动作。
- `completed`：任务完成并写回 WhyWait 数据。

## BLE 协议

设备名：`WhyWait Companion`

| 用途 | UUID |
| --- | --- |
| Service | `7b1f0001-6a9b-4d5c-a7e1-3d9b8c5f0001` |
| State | `7b1f0002-6a9b-4d5c-a7e1-3d9b8c5f0001` |
| Command | `7b1f0003-6a9b-4d5c-a7e1-3d9b8c5f0001` |
| Telemetry | `7b1f0004-6a9b-4d5c-a7e1-3d9b8c5f0001` |

网页向 State 特征写入：

```json
{
  "state": "prompted",
  "display": "打开 Word，输入论文标题",
  "accent": "#FF6B35"
}
```

设备通过 Telemetry 特征发送：

```json
{"type":"event","event":"tap","at":1770000000000}
```

支持的事件为 `tap`、`long-press`、`shake` 和 `complete`。

## 固件

`esp32/action_companion.ino` 是不依赖屏幕的 ESP32 BLE 固件骨架，包含单击、长按、LED、振动和状态通知。
