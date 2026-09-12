"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BatteryMedium,
  Bluetooth,
  BookOpen,
  CheckCircle2,
  CircleDot,
  Cpu,
  Crosshair,
  Eye,
  ExternalLink,
  Gauge,
  MousePointerClick,
  Pencil,
  Play,
  Radio,
  RotateCcw,
  Rocket,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Timer,
  Vibrate,
  X,
  Zap,
} from "lucide-react";
import { PageTransition } from "@/components/Animations";
import { useAppData } from "@/hooks/useAppData";
import { useToast } from "@/components/Toast";
import {
  buildRescueLadder,
  buildShrunkAction,
  DEFAULT_RESCUE_CONTEXT,
  elapsedMinutes,
  formatRemaining,
  readRescueContext,
  type RescueContext,
} from "@/lib/rescue";
import {
  COMPANION_GATT,
  getCompanionSnapshot,
  transitionCompanion,
  type CompanionEvent,
  type CompanionState,
} from "@/lib/companion";
import {
  addFocusSession,
  completeSubTask,
  completeTask,
  createTask,
  getSubTasksByTask,
  insertMicroSubTask,
  updateTask,
} from "@/lib/store";
import { generateId } from "@/lib/utils";
import type { SubTask, Task } from "@/lib/types";

const SESSION_SECONDS = 5 * 60;

export default function RescuePage() {
  const { data, update, loaded } = useAppData();
  const { showToast } = useToast();
  const [context, setContext] = useState<RescueContext>(DEFAULT_RESCUE_CONTEXT);
  const [ladder, setLadder] = useState<string[]>(() =>
    buildRescueLadder(
      DEFAULT_RESCUE_CONTEXT.taskTitle,
      DEFAULT_RESCUE_CONTEXT.microStep
    )
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(SESSION_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [companionState, setCompanionState] =
    useState<CompanionState>("observing");
  const [events, setEvents] = useState<string[]>([
    "设备已进入观察状态，等待拯救信号",
  ]);
  const [deviceStatus, setDeviceStatus] = useState<
    "simulator" | "connecting" | "connected"
  >("simulator");
  const [showTaskEditor, setShowTaskEditor] = useState(false);
  const [taskDraft, setTaskDraft] = useState(DEFAULT_RESCUE_CONTEXT.taskTitle);
  const [stepDraft, setStepDraft] = useState(DEFAULT_RESCUE_CONTEXT.microStep);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [selectedSubTaskId, setSelectedSubTaskId] = useState("");
  const completedRef = useRef(false);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const deviceRef = useRef<any>(null);
  const stateCharacteristicRef = useRef<any>(null);
  const dispatchRef = useRef<(event: CompanionEvent) => void>(() => {});
  const selectionInitializedRef = useRef(false);

  const activeTasks = useMemo(
    () => data.tasks.filter((task) => task.status !== "completed"),
    [data.tasks]
  );
  const selectedTask =
    activeTasks.find((task) => task.id === selectedTaskId) ||
    data.tasks.find((task) => task.id === selectedTaskId) ||
    null;
  const selectedTaskSteps = useMemo(
    () => (selectedTask ? getSubTasksByTask(data, selectedTask.id) : []),
    [data, selectedTask]
  );
  const selectedSubTask =
    selectedTaskSteps.find((subTask) => subTask.id === selectedSubTaskId) ||
    null;
  const taskTitle = selectedTask?.title || context.taskTitle;
  const microStep =
    selectedSubTask?.microStep ||
    selectedSubTask?.title ||
    ladder[stepIndex] ||
    context.microStep;
  const activeStepIndex = selectedSubTask
    ? Math.max(
        0,
        selectedTaskSteps.findIndex((subTask) => subTask.id === selectedSubTask.id)
      )
    : stepIndex;
  const activeStepTotal = selectedSubTask
    ? selectedTaskSteps.length
    : ladder.length;

  useEffect(() => {
    const nextContext = readRescueContext(window.location.search);
    const nextLadder = buildRescueLadder(
      nextContext.taskTitle,
      nextContext.microStep
    );
    setContext(nextContext);
    setTaskDraft(nextContext.taskTitle);
    setStepDraft(nextContext.microStep);
    setLadder(nextLadder);
    setStepIndex(0);
    setEvents((current) => [
      `已接收 ${nextContext.source || "本地"} 的救援信号`,
      ...current,
    ]);
  }, []);

  useEffect(() => {
    if (!loaded || selectionInitializedRef.current || activeTasks.length === 0) {
      return;
    }

    const queryTask =
      data.tasks.find((task) => task.id === context.taskId) ||
      activeTasks.find((task) => task.title === context.taskTitle) ||
      activeTasks[0];
    const steps = getSubTasksByTask(data, queryTask.id);
    const querySubTask =
      steps.find((subTask) => subTask.id === context.subTaskId) ||
      steps.find(
        (subTask) =>
          subTask.title === context.microStep ||
          subTask.microStep === context.microStep
      ) ||
      steps.find((subTask) => subTask.status !== "completed") ||
      steps[0];

    setSelectedTaskId(queryTask.id);
    if (querySubTask) {
      setSelectedSubTaskId(querySubTask.id);
      setContext((current) => ({
        ...current,
        taskId: queryTask.id,
        subTaskId: querySubTask.id,
        taskTitle: queryTask.title,
        microStep: querySubTask.microStep || querySubTask.title,
      }));
    } else {
      setContext((current) => ({
        ...current,
        taskId: queryTask.id,
        taskTitle: queryTask.title,
      }));
    }
    selectionInitializedRef.current = true;
  }, [
    activeTasks,
    context.microStep,
    context.subTaskId,
    context.taskId,
    context.taskTitle,
    data,
    loaded,
  ]);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel("whywait-action-companion");
    channelRef.current = channel;
    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, []);

  const companion = getCompanionSnapshot(companionState);
  const progress = 1 - secondsLeft / SESSION_SECONDS;
  const isCompleted = companionState === "completed";

  const pushEvent = useCallback((message: string) => {
    setEvents((current) => [message, ...current].slice(0, 5));
  }, []);

  useEffect(() => {
    if (!channelRef.current) return;
    channelRef.current.postMessage({
      type: "companion-state",
      state: companionState,
      microStep,
      isRunning,
      updatedAt: new Date().toISOString(),
    });
  }, [companionState, isRunning, microStep]);

  const handleComplete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setIsRunning(false);
    setSecondsLeft(0);

    const focusMinutes = elapsedMinutes(startedAt) || 5;
    const sessionStart =
      startedAt || new Date(Date.now() - focusMinutes * 60000).toISOString();
    const sessionEnd = new Date().toISOString();
    const nextSubTask = selectedSubTask
      ? selectedTaskSteps.find(
          (subTask) =>
            subTask.id !== selectedSubTask.id &&
            subTask.status !== "completed"
        )
      : null;

    update((previous) => {
      if (selectedSubTask && selectedTask) {
        const completed = completeSubTask(previous, selectedSubTask.id);
        const withTime = updateTask(completed, selectedTask.id, {
          actualTime:
            (previous.tasks.find((task) => task.id === selectedTask.id)
              ?.actualTime || 0) + focusMinutes,
        });
        return addFocusSession(withTime, {
          taskId: selectedTask.id,
          subTaskId: selectedSubTask.id,
          taskTitle: selectedTask.title,
          duration: focusMinutes,
          mode: "pomodoro",
          completed: true,
          startedAt: sessionStart,
          endedAt: sessionEnd,
        });
      }

      const created = createTask(previous, {
        title: `救援行动：${taskTitle}`,
        description: microStep,
        priority: "medium",
        status: "todo",
        category: "行动救援",
        estimatedTime: 5,
        estimatedUnit: "minute",
        tags: ["行动救援", context.source || "rescue"],
      });
      const task = created.tasks[created.tasks.length - 1];
      const completed = completeTask(created, task.id);
      return addFocusSession(completed, {
        taskId: task.id,
        subTaskId: null,
        taskTitle: task.title,
        duration: focusMinutes,
        mode: "pomodoro",
        completed: true,
        startedAt: sessionStart,
        endedAt: sessionEnd,
      });
    });

    if (selectedSubTask && selectedTask) {
      pushEvent(`已完成「${selectedSubTask.title}」并记录 ${focusMinutes} 分钟`);
      if (nextSubTask) {
        setSelectedSubTaskId(nextSubTask.id);
        setContext((current) => ({
          ...current,
          taskId: selectedTask.id,
          subTaskId: nextSubTask.id,
          taskTitle: selectedTask.title,
          microStep: nextSubTask.microStep || nextSubTask.title,
        }));
        setLadder(
          buildRescueLadder(
            selectedTask.title,
            nextSubTask.microStep || nextSubTask.title
          )
        );
        setStepIndex(0);
        setSecondsLeft(SESSION_SECONDS);
        setStartedAt(null);
        completedRef.current = false;
        setCompanionState("prompted");
        showToast(`下一步：${nextSubTask.title}`, "success");
      } else {
        setCompanionState("completed");
        showToast("整个任务的所有步骤都完成了", "success");
      }
    } else {
      setCompanionState("completed");
      pushEvent(`突破完成，已记录 ${focusMinutes} 分钟行动能量`);
      showToast(`完成得漂亮，已记录 ${focusMinutes} 分钟`, "success");
    }

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("WhyWait 微行动完成", {
        body: `${taskTitle}：${microStep}`,
      });
    }
  }, [
    context.source,
    microStep,
    pushEvent,
    selectedSubTask,
    selectedTask,
    selectedTaskSteps,
    showToast,
    startedAt,
    taskTitle,
    update,
  ]);

  useEffect(() => {
    if (!isRunning) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          handleComplete();
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [handleComplete, isRunning]);

  const startSession = useCallback(() => {
    if (completedRef.current) return;
    if (!startedAt) setStartedAt(new Date().toISOString());
    setIsRunning(true);
    setCompanionState("focusing");
    pushEvent("行动启动，能量核心进入专注状态");
  }, [pushEvent, startedAt]);

  const toggleSession = useCallback(() => {
    if (isRunning) {
      setIsRunning(false);
      setCompanionState("prompted");
      pushEvent("行动暂停，计时能量已冻结");
      return;
    }
    startSession();
  }, [isRunning, pushEvent, startSession]);

  const shrinkAction = useCallback(() => {
    if (selectedSubTask && selectedTask) {
      const newId = generateId();
      const shrunk = buildShrunkAction(
        selectedSubTask.title,
        selectedSubTask.microStep
      );
      update((previous) =>
        insertMicroSubTask(previous, selectedSubTask.id, newId)
      );
      setSelectedSubTaskId(newId);
      setContext((current) => ({
        ...current,
        taskId: selectedTask.id,
        subTaskId: newId,
        taskTitle: selectedTask.title,
        microStep: shrunk.microStep,
      }));
      setLadder(buildRescueLadder(selectedTask.title, shrunk.microStep));
      setStepIndex(0);
      setSecondsLeft(SESSION_SECONDS);
      setStartedAt(null);
      completedRef.current = false;
      setCompanionState("rescued");
      pushEvent(`已把步骤切细：${shrunk.title}`);
      return;
    }

    setStepIndex((current) => {
      const next = Math.min(current + 1, ladder.length - 1);
      pushEvent(
        next === current
          ? "已经是最小动作，只做 120 秒也可以"
          : `目标缩小：${ladder[next]}`
      );
      return next;
    });
    setCompanionState("rescued");
  }, [ladder, pushEvent, selectedSubTask, selectedTask, update]);

  const resetSession = useCallback(() => {
    completedRef.current = false;
    setIsRunning(false);
    setSecondsLeft(SESSION_SECONDS);
    setStartedAt(null);
    setStepIndex(0);
    setCompanionState("observing");
    pushEvent("救援台已重置，等待下一次逃避信号");
  }, [pushEvent]);

  const openTaskEditor = useCallback(() => {
    setTaskDraft(context.taskTitle);
    setStepDraft(microStep);
    setShowTaskEditor(true);
  }, [context.taskTitle, microStep]);

  const saveTask = useCallback(() => {
    const nextTask = activeTasks.find((task) => task.id === selectedTaskId);
    const nextSubTask = nextTask
      ? getSubTasksByTask(data, nextTask.id).find(
          (subTask) => subTask.id === selectedSubTaskId
        )
      : null;
    const nextTaskTitle = nextTask?.title || taskDraft.trim() || "当前任务";
    const nextMicroStep =
      nextSubTask?.microStep ||
      nextSubTask?.title ||
      stepDraft.trim() ||
      `打开与“${nextTaskTitle}”有关的文件`;
    const nextLadder = buildRescueLadder(nextTaskTitle, nextMicroStep);

    completedRef.current = false;
    setIsRunning(false);
    setSecondsLeft(SESSION_SECONDS);
    setStartedAt(null);
    setStepIndex(0);
    setContext({
      taskTitle: nextTaskTitle,
      microStep: nextMicroStep,
      taskId: nextTask?.id,
      subTaskId: nextSubTask?.id,
      source: "manual-edit",
    });
    setLadder(nextLadder);
    setCompanionState("prompted");
    setShowTaskEditor(false);
    pushEvent(`已切换大任务：${nextTaskTitle}`);
  }, [
    activeTasks,
    data,
    pushEvent,
    selectedSubTaskId,
    selectedTaskId,
    stepDraft,
    taskDraft,
  ]);

  const goNextAction = useCallback(() => {
    if (selectedSubTask && selectedTask) {
      const currentIndex = selectedTaskSteps.findIndex(
        (subTask) => subTask.id === selectedSubTask.id
      );
      const nextSubTask =
        selectedTaskSteps
          .slice(currentIndex + 1)
          .find((subTask) => subTask.status !== "completed") ||
        selectedTaskSteps.find(
          (subTask) =>
            subTask.id !== selectedSubTask.id && subTask.status !== "completed"
        );

      if (nextSubTask) {
        setSelectedSubTaskId(nextSubTask.id);
        setContext((current) => ({
          ...current,
          taskId: selectedTask.id,
          subTaskId: nextSubTask.id,
          taskTitle: selectedTask.title,
          microStep: nextSubTask.microStep || nextSubTask.title,
        }));
        setLadder(
          buildRescueLadder(
            selectedTask.title,
            nextSubTask.microStep || nextSubTask.title
          )
        );
        setStepIndex(0);
        setSecondsLeft(SESSION_SECONDS);
        setStartedAt(null);
        completedRef.current = false;
        setCompanionState("prompted");
        pushEvent(`切换到下一步：${nextSubTask.title}`);
      } else {
        pushEvent("这个任务已经没有未完成步骤了");
      }
      return;
    }

    setStepIndex((current) => {
      const next = (current + 1) % ladder.length;
      pushEvent(`切换到下一步：${ladder[next]}`);
      return next;
    });
    setCompanionState("prompted");
  }, [ladder, pushEvent, selectedSubTask, selectedTask, selectedTaskSteps]);

  const dispatchCompanion = useCallback(
    (event: CompanionEvent) => {
      setCompanionState((current) => transitionCompanion(current, event));

      if (event === "tap") {
        if (isRunning) {
          setIsRunning(false);
          pushEvent("Action Companion：单击暂停");
        } else {
          startSession();
        }
      }
      if (event === "long-press") {
        shrinkAction();
        pushEvent("Action Companion：长按救援，目标已缩小");
      }
      if (event === "shake") {
        setStepIndex((current) => (current + 1) % ladder.length);
        pushEvent("Action Companion：摇一摇切换低阻力动作");
      }
    },
    [isRunning, ladder.length, pushEvent, shrinkAction, startSession]
  );

  useEffect(() => {
    dispatchRef.current = dispatchCompanion;
  }, [dispatchCompanion]);

  useEffect(() => {
    if (deviceStatus !== "connected" || !stateCharacteristicRef.current) return;
    const payload = new TextEncoder().encode(
      JSON.stringify({
        state: companionState,
        display: microStep,
        isRunning,
        accent: companion.accent,
        updatedAt: new Date().toISOString(),
      })
    );
    stateCharacteristicRef.current.writeValue(payload).catch((error: unknown) => {
      console.error("Failed to sync companion state:", error);
    });
  }, [
    companion.accent,
    companionState,
    deviceStatus,
    isRunning,
    microStep,
  ]);

  const connectCompanion = useCallback(async () => {
    const bluetooth = (navigator as any).bluetooth;
    if (!bluetooth) {
      showToast("当前浏览器不支持 Web Bluetooth，可继续使用模拟器", "warning");
      return;
    }

    setDeviceStatus("connecting");
    try {
      const device = await bluetooth.requestDevice({
        filters: [{ services: [COMPANION_GATT.service] }],
        optionalServices: [COMPANION_GATT.service],
      });
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(COMPANION_GATT.service);
      const stateCharacteristic = await service.getCharacteristic(
        COMPANION_GATT.stateCharacteristic
      );
      const telemetryCharacteristic = await service.getCharacteristic(
        COMPANION_GATT.telemetryCharacteristic
      );

      deviceRef.current = device;
      stateCharacteristicRef.current = stateCharacteristic;
      await telemetryCharacteristic.startNotifications();
      telemetryCharacteristic.addEventListener(
        "characteristicvaluechanged",
        (event: Event) => {
          try {
            const target = event.target as any;
            const payload = JSON.parse(
              new TextDecoder().decode(target.value)
            ) as { event?: CompanionEvent };
            if (payload.event) {
              dispatchRef.current(payload.event);
              pushEvent(`Action Companion：收到 ${payload.event}`);
            }
          } catch (error) {
            console.error("Invalid companion telemetry:", error);
          }
        }
      );
      device.addEventListener("gattserverdisconnected", () => {
        deviceRef.current = null;
        stateCharacteristicRef.current = null;
        setDeviceStatus("simulator");
        pushEvent("Action Companion 已断开，自动切回模拟器");
      });

      setDeviceStatus("connected");
      pushEvent("Action Companion 已建立 BLE 连接");
      showToast("实体设备已连接", "success");
    } catch (error) {
      setDeviceStatus("simulator");
      console.error("Companion connection failed:", error);
      showToast("未连接实体设备，继续使用模拟器", "info");
    }
  }, [pushEvent, showToast]);

  const deepLink = useMemo(() => {
    const params = new URLSearchParams({
      task: taskTitle,
      step: microStep,
      source: "companion-deep-link",
    });
    if (selectedTask?.id) params.set("taskId", selectedTask.id);
    if (selectedSubTask?.id) params.set("subTaskId", selectedSubTask.id);
    return `/rescue?${params.toString()}`;
  }, [microStep, selectedSubTask?.id, selectedTask?.id, taskTitle]);

  return (
    <PageTransition>
      <div
        className="relative z-10 -m-4 md:-m-8 min-h-screen overflow-hidden"
        style={{
          color: "#F5F7FF",
          background:
            "linear-gradient(145deg, #0A1020 0%, #111A37 45%, #101A2F 100%)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(rgba(125,211,252,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(125,211,252,.08) 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />
        <div
          className="absolute inset-x-0 top-0 h-1"
          style={{
            background:
              "linear-gradient(90deg, #FF6B35 0%, #F5B942 35%, #4ECDC4 68%, #A78BFA 100%)",
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto p-4 md:p-8 space-y-5">
          <MissionHeader
            source={context.source || "rescue-page"}
            state={companionState}
            accent={companion.accent}
            onChangeTask={openTaskEditor}
          />

          <MissionProgress
            started={Boolean(startedAt)}
            focusing={isRunning || isCompleted}
            completed={isCompleted}
            accent={companion.accent}
          />

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,.85fr)]">
            <section
              className="relative overflow-hidden rounded-[28px] p-5 md:p-8"
              style={{
                background:
                  "linear-gradient(150deg, rgba(27,39,73,.98), rgba(13,20,40,.98))",
                border: `1px solid ${companion.accent}55`,
                boxShadow: `0 24px 80px ${companion.accent}18`,
              }}
            >
              <div
                className="absolute -right-16 -top-16 w-56 h-56 rounded-full pointer-events-none"
                style={{
                  border: `1px solid ${companion.accent}33`,
                  boxShadow: `0 0 0 24px ${companion.accent}08, 0 0 0 48px ${companion.accent}05`,
                }}
              />

              <div className="relative flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className="w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{
                      color: "#fff",
                      background: companion.accent,
                      boxShadow: `0 0 28px ${companion.accent}66`,
                    }}
                  >
                    <Crosshair className="w-5 h-5" />
                  </span>
                  <div>
                    <p className="font-pixel text-[9px]" style={{ color: companion.accent }}>
                      CURRENT MISSION
                    </p>
                    <p className="font-hand text-sm text-white/60 mt-1">
                      {taskTitle}
                    </p>
                  </div>
                </div>
                <div
                  className="px-3 py-1.5 rounded-full font-pixel text-[8px]"
                  style={{
                    color: companion.accent,
                    background: `${companion.accent}14`,
                    border: `1px solid ${companion.accent}44`,
                  }}
                >
                  STEP {String(activeStepIndex + 1).padStart(2, "0")} /{" "}
                  {String(activeStepTotal).padStart(2, "0")}
                </div>
              </div>

              <div className="relative grid gap-7 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center my-8 md:my-12">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={microStep}
                    initial={{ opacity: 0, x: -18, filter: "blur(8px)" }}
                    animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, x: 18, filter: "blur(8px)" }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Zap className="w-4 h-4" style={{ color: companion.accent }} />
                      <span className="font-hand text-xs text-white/50">
                        只执行这一条指令
                      </span>
                    </div>
                    <h1 className="font-sketch text-3xl md:text-5xl font-bold leading-tight text-[#F5F7FF]">
                      {microStep}
                    </h1>
                    <div className="flex flex-wrap gap-2 mt-6">
                      <MissionChip label="5 分钟" />
                      <MissionChip
                        label={
                          selectedSubTask
                            ? `已有步骤 ${activeStepIndex + 1}`
                            : `阻力阶梯 ${stepIndex + 1}`
                        }
                      />
                      <MissionChip label={isRunning ? "行动中" : "等待启动"} />
                    </div>
                  </motion.div>
                </AnimatePresence>

                <EnergyCore
                  progress={progress}
                  accent={companion.accent}
                  secondsLeft={secondsLeft}
                  isRunning={isRunning}
                  isCompleted={isCompleted}
                />
              </div>

              <div className="relative grid gap-3 sm:grid-cols-[1.5fr_1fr_1fr]">
                <motion.button
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={toggleSession}
                  disabled={isCompleted}
                  className="min-h-14 rounded-2xl px-5 py-3 font-hand font-bold flex items-center justify-center gap-3 disabled:opacity-35"
                  style={{
                    color: "#fff",
                    background: isRunning ? "#33426F" : companion.accent,
                    border: `1px solid ${companion.accent}`,
                    boxShadow: `0 7px 0 ${isRunning ? "#202B4C" : `${companion.accent}88`}`,
                  }}
                >
                  {isRunning ? <Timer className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  {isRunning ? "暂停行动" : "启动 5 分钟"}
                </motion.button>
                <motion.button
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={shrinkAction}
                  disabled={isCompleted}
                  className="min-h-14 rounded-2xl px-4 py-3 font-hand font-bold flex items-center justify-center gap-2 disabled:opacity-35"
                  style={{
                    color: "#E9E2FF",
                    background: "rgba(167,139,250,.14)",
                    border: "1px solid rgba(167,139,250,.5)",
                  }}
                >
                  <Sparkles className="w-5 h-5" />
                  我卡住了，再缩小
                </motion.button>
                <motion.button
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleComplete}
                  disabled={isCompleted}
                  className="min-h-14 rounded-2xl px-4 py-3 font-hand font-bold flex items-center justify-center gap-2 disabled:opacity-35"
                  style={{
                    color: "#071B18",
                    background: "#4ECDC4",
                    boxShadow: "0 7px 0 #2E9A92",
                  }}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  突破完成
                </motion.button>
              </div>

              <div className="relative flex items-center justify-between mt-6 pt-5 border-t border-white/10">
                <span className="font-hand text-xs text-white/40">
                  卡住不是失败，缩小目标继续前进
                </span>
                <div className="flex items-center gap-4">
                  <button
                    onClick={goNextAction}
                    disabled={isCompleted}
                    className="font-hand text-xs flex items-center gap-1.5 text-white/50 hover:text-white/80 disabled:opacity-30"
                  >
                    换个下一步
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={resetSession}
                    className="font-hand text-xs flex items-center gap-1.5 text-white/40 hover:text-white/70"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    重置任务
                  </button>
                </div>
              </div>
            </section>

            <aside className="space-y-5">
              <CompanionPanel
                state={companionState}
                label={companion.label}
                detail={companion.detail}
                accent={companion.accent}
                deviceStatus={deviceStatus}
                onAction={dispatchCompanion}
                onConnect={connectCompanion}
                gattService={COMPANION_GATT.service}
              />

              <section
                className="rounded-3xl p-5"
                style={{
                  background: "rgba(255,255,255,.045)",
                  border: "1px solid rgba(255,255,255,.09)",
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-4 h-4" style={{ color: "#7DD3FC" }} />
                  <h2 className="font-sketch text-base font-bold text-[#F5F7FF]">
                    行动日志
                  </h2>
                </div>
                <div className="space-y-3">
                  {events.map((event, index) => (
                    <motion.div
                      key={`${event}-${index}`}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex gap-3 font-hand text-xs"
                      style={{ color: index === 0 ? "#F5F7FF" : "rgba(245,247,255,.42)" }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                        style={{
                          background:
                            index === 0 ? companion.accent : "rgba(255,255,255,.16)",
                          boxShadow:
                            index === 0 ? `0 0 10px ${companion.accent}` : "none",
                        }}
                      />
                      <span>{event}</span>
                    </motion.div>
                  ))}
                </div>
              </section>
            </aside>
          </div>

          <MissionGuide />

          <section
            className="rounded-3xl p-5 md:p-6 grid gap-5 md:grid-cols-[1fr_auto] md:items-center"
            style={{
              background: "rgba(255,255,255,.04)",
              border: "1px solid rgba(255,255,255,.08)",
            }}
          >
            <div className="flex gap-4">
              <span
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ color: "#071B18", background: "#7DD3FC" }}
              >
                <Cpu className="w-5 h-5" />
              </span>
              <div>
                <p className="font-pixel text-[8px] text-sky-300">
                  AGENT SKILL ONLINE
                </p>
                <h2 className="font-sketch text-xl font-bold text-[#F5F7FF] mt-2">
                  $whywait-action-coach
                </h2>
                <p className="font-hand text-xs text-white/45 mt-2">
                  浏览器或 Agent 把逃避信号交给它，它只返回一个低阻力动作和对应设备指令。
                </p>
              </div>
            </div>
            <a
              href={deepLink}
              className="min-h-12 px-5 rounded-2xl flex items-center justify-center gap-2 font-hand text-sm font-bold"
              style={{
                color: "#071B18",
                background: "#F5B942",
                boxShadow: "0 5px 0 #A66F10",
              }}
            >
              生成新的救援链接
              <ExternalLink className="w-4 h-4" />
            </a>
          </section>
        </div>

        <AnimatePresence>
          {isCompleted && <ConfettiBurst accent={companion.accent} />}
        </AnimatePresence>
        <AnimatePresence>
          {showTaskEditor && (
            <TaskEditor
              tasks={activeTasks}
              steps={selectedTaskSteps}
              selectedTaskId={selectedTaskId}
              selectedSubTaskId={selectedSubTaskId}
              taskDraft={taskDraft}
              stepDraft={stepDraft}
              setTaskDraft={setTaskDraft}
              setStepDraft={setStepDraft}
              setSelectedTaskId={(taskId) => {
                setSelectedTaskId(taskId);
                const firstStep = getSubTasksByTask(data, taskId).find(
                  (subTask) => subTask.status !== "completed"
                );
                setSelectedSubTaskId(firstStep?.id || "");
              }}
              setSelectedSubTaskId={setSelectedSubTaskId}
              onClose={() => setShowTaskEditor(false)}
              onSave={saveTask}
            />
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}

function MissionHeader({
  source,
  state,
  accent,
  onChangeTask,
}: {
  source: string;
  state: CompanionState;
  accent: string;
  onChangeTask: () => void;
}) {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{
            color: "#07111F",
            background: accent,
            boxShadow: `0 0 30px ${accent}55`,
          }}
        >
          <Rocket className="w-6 h-6" />
        </motion.div>
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5" style={{ color: accent }} />
            <span className="font-pixel text-[9px]" style={{ color: accent }}>
              ACTION RESCUE SYSTEM
            </span>
          </div>
          <h1 className="font-sketch text-2xl md:text-3xl font-bold text-[#F5F7FF] mt-2">
            拖延突围任务
          </h1>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onChangeTask}
          className="px-3 py-2 rounded-xl flex items-center gap-2 font-hand text-xs font-bold"
          style={{
            color: "#07111F",
            background: "#FFF5A8",
            border: "1.5px solid rgba(43,58,103,.24)",
            boxShadow: "2px 3px 0 rgba(0,0,0,.18)",
            transform: "rotate(-1deg)",
          }}
        >
          <Pencil className="w-3.5 h-3.5" />
          换大任务
        </button>
        <span
          className="px-3 py-2 rounded-xl font-mono text-[10px] text-white/55"
          style={{
            background: "rgba(255,255,255,.05)",
            border: "1px solid rgba(255,255,255,.08)",
          }}
        >
          SOURCE / {source}
        </span>
        <span
          className="px-3 py-2 rounded-xl flex items-center gap-2 font-hand text-xs"
          style={{
            color: accent,
            background: `${accent}12`,
            border: `1px solid ${accent}35`,
          }}
        >
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          {state === "completed" ? "任务突破" : "信号在线"}
        </span>
      </div>
    </header>
  );
}

function MissionProgress({
  started,
  focusing,
  completed,
  accent,
}: {
  started: boolean;
  focusing: boolean;
  completed: boolean;
  accent: string;
}) {
  const steps = [
    { label: "拦截信号", done: true, active: false },
    { label: "锁定动作", done: started, active: !started },
    { label: "行动启动", done: completed, active: focusing && !completed },
    { label: "回收数据", done: completed, active: completed },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {steps.map((step, index) => (
        <div key={step.label} className="relative">
          <div
            className="h-1.5 rounded-full mb-3 overflow-hidden"
            style={{ background: "rgba(255,255,255,.08)" }}
          >
            <motion.div
              initial={false}
              animate={{
                width: step.done || step.active ? "100%" : "0%",
                opacity: step.active && !step.done ? [0.35, 1, 0.35] : 1,
              }}
              transition={{
                duration: step.active && !step.done ? 1.4 : 0.35,
                repeat: step.active && !step.done ? Infinity : 0,
              }}
              className="h-full rounded-full"
              style={{ background: step.active ? accent : "#4ECDC4" }}
            />
          </div>
          <span
            className="font-hand text-[10px]"
            style={{
              color:
                step.active || step.done ? "rgba(245,247,255,.75)" : "rgba(245,247,255,.25)",
            }}
          >
            0{index + 1} {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function MissionChip({ label }: { label: string }) {
  return (
    <span
      className="px-3 py-1.5 rounded-full font-hand text-[11px] text-white/55"
      style={{
        background: "rgba(255,255,255,.05)",
        border: "1px solid rgba(255,255,255,.08)",
      }}
    >
      {label}
    </span>
  );
}

function EnergyCore({
  progress,
  accent,
  secondsLeft,
  isRunning,
  isCompleted,
}: {
  progress: number;
  accent: string;
  secondsLeft: number;
  isRunning: boolean;
  isCompleted: boolean;
}) {
  const safeProgress = Math.max(0, Math.min(1, progress));

  return (
    <div className="flex justify-center lg:justify-end">
      <div className="relative w-[190px] h-[190px] flex items-center justify-center">
        <motion.div
          animate={{ rotate: isRunning ? 360 : 0 }}
          transition={{ duration: 7, repeat: isRunning ? Infinity : 0, ease: "linear" }}
          className="absolute inset-0 rounded-full"
          style={{
            border: `2px dashed ${accent}66`,
            boxShadow: `0 0 40px ${accent}20`,
          }}
        />
        <div
          className="absolute inset-4 rounded-full"
          style={{
            background: `conic-gradient(${accent} ${safeProgress * 360}deg, rgba(255,255,255,.07) 0deg)`,
          }}
        />
        <div
          className="absolute inset-[26px] rounded-full flex flex-col items-center justify-center"
          style={{
            background: "#0B1429",
            border: `1px solid ${accent}44`,
            boxShadow: `inset 0 0 30px ${accent}16`,
          }}
        >
          <Gauge className="w-5 h-5 mb-2" style={{ color: accent }} />
          <span className="font-pixel text-xl text-[#F5F7FF]">
            {formatRemaining(secondsLeft)}
          </span>
          <span className="font-hand text-[10px] text-white/40 mt-2">
            {isCompleted ? "能量回收" : isRunning ? "行动能量" : "待机"}
          </span>
        </div>
      </div>
    </div>
  );
}

function CompanionPanel({
  state,
  label,
  detail,
  accent,
  deviceStatus,
  onAction,
  onConnect,
  gattService,
}: {
  state: CompanionState;
  label: string;
  detail: string;
  accent: string;
  deviceStatus: "simulator" | "connecting" | "connected";
  onAction: (event: CompanionEvent) => void;
  onConnect: () => void;
  gattService: string;
}) {
  return (
    <section
      className="rounded-3xl p-5"
      style={{
        background:
          "linear-gradient(160deg, rgba(255,255,255,.07), rgba(255,255,255,.025))",
        border: "1px solid rgba(255,255,255,.1)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4" style={{ color: accent }} />
            <h2 className="font-sketch text-base font-bold text-[#F5F7FF]">
              ACTION COMPANION
            </h2>
          </div>
          <p className="font-hand text-[11px] text-white/35 mt-1">
            实体设备控制器
          </p>
        </div>
        <span
          className="px-2.5 py-1 rounded-full font-pixel text-[7px]"
          style={{ color: "#07111F", background: accent }}
        >
          {deviceStatus === "connected" ? "ONLINE" : "SIM"}
        </span>
      </div>

      <div className="flex justify-center py-7" style={{ perspective: "700px" }}>
        <motion.div
          animate={{
            rotateX: state === "focusing" ? [-8, 8, -8] : [-4, 4, -4],
            rotateY: state === "rescued" ? [-18, 18, -18] : [12, -12, 12],
            scale: state === "focusing" ? [1, 1.04, 1] : 1,
          }}
          transition={{
            duration: state === "focusing" ? 2 : 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="w-28 h-28 rounded-[28px] flex items-center justify-center relative"
          style={{
            transformStyle: "preserve-3d",
            background: `linear-gradient(145deg, ${accent}, #111A37)`,
            border: "3px solid rgba(255,255,255,.55)",
            boxShadow: `0 20px 50px ${accent}55, inset 0 0 25px rgba(255,255,255,.18)`,
          }}
        >
          <div
            className="absolute inset-3 rounded-[22px]"
            style={{ border: `1px dashed ${accent}` }}
          />
          {state === "focusing" ? (
            <Timer className="w-10 h-10 text-[#F5F7FF]" />
          ) : state === "rescued" ? (
            <Sparkles className="w-10 h-10 text-[#F5F7FF]" />
          ) : state === "completed" ? (
            <ShieldCheck className="w-10 h-10 text-[#F5F7FF]" />
          ) : (
            <CircleDot className="w-10 h-10 text-[#F5F7FF]" />
          )}
        </motion.div>
      </div>

      <div className="text-center mb-5">
        <p className="font-sketch text-lg font-bold" style={{ color: accent }}>
          {label}
        </p>
        <p className="font-hand text-xs text-white/40 mt-1">{detail}</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <CompanionButton
          label="单击"
          sub="启动/暂停"
          icon={<MousePointerClick className="w-4 h-4" />}
          onClick={() => onAction("tap")}
        />
        <CompanionButton
          label="长按"
          sub="缩小目标"
          icon={<Sparkles className="w-4 h-4" />}
          onClick={() => onAction("long-press")}
        />
        <CompanionButton
          label="摇一摇"
          sub="换一个动作"
          icon={<Vibrate className="w-4 h-4" />}
          onClick={() => onAction("shake")}
        />
      </div>

      <div className="mt-5 pt-4 border-t border-white/10 space-y-3">
        <div className="flex items-center justify-between font-hand text-xs">
          <span className="flex items-center gap-2 text-white/45">
            <Bluetooth className="w-3.5 h-3.5" />
            BLE 控制器
          </span>
          <button
            onClick={onConnect}
            disabled={deviceStatus === "connecting" || deviceStatus === "connected"}
            className="font-bold"
            style={{
              color:
                deviceStatus === "connected"
                  ? "#4ECDC4"
                  : deviceStatus === "connecting"
                    ? "rgba(255,255,255,.35)"
                    : accent,
            }}
          >
            {deviceStatus === "connected"
              ? "已连接"
              : deviceStatus === "connecting"
                ? "连接中..."
                : "连接真机"}
          </button>
        </div>
        <div className="flex items-center justify-between font-hand text-xs">
          <span className="flex items-center gap-2 text-white/45">
            <BatteryMedium className="w-3.5 h-3.5" />
            控制器电量
          </span>
          <span className="text-white/60">模拟 87%</span>
        </div>
        <div
          className="rounded-xl p-2.5 font-mono text-[8px] break-all text-white/25"
          style={{ background: "rgba(0,0,0,.2)" }}
        >
          {gattService}
        </div>
      </div>
    </section>
  );
}

function CompanionButton({
  label,
  sub,
  icon,
  onClick,
}: {
  label: string;
  sub: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className="rounded-2xl px-2 py-3 flex flex-col items-center gap-1 font-hand"
      style={{
        color: "#F5F7FF",
        background: "rgba(255,255,255,.06)",
        border: "1px solid rgba(255,255,255,.09)",
      }}
    >
      {icon}
      <span className="text-[11px] font-bold">{label}</span>
      <span className="text-[8px] text-white/30">{sub}</span>
    </motion.button>
  );
}

function MissionGuide() {
  const guides = [
    {
      number: "01",
      title: "怎么换大任务",
      body: "点右上角“换大任务”，直接从已有任务里选择任务和步骤，和专注模式共用同一份数据。",
      icon: <Pencil className="w-5 h-5" />,
      accent: "#F5B942",
    },
    {
      number: "02",
      title: "怎么进入下一步",
      body: "按“突破完成”后会标记当前步骤，并自动跳到任务里的下一个未完成步骤。",
      icon: <ArrowRight className="w-5 h-5" />,
      accent: "#4ECDC4",
    },
    {
      number: "03",
      title: "卡住了怎么切细",
      body: "“我卡住了，再缩小”会在当前步骤前插入一个更小步骤，原步骤保留在后面。",
      icon: <Eye className="w-5 h-5" />,
      accent: "#A78BFA",
    },
  ];

  return (
    <section
      className="rounded-3xl p-5 md:p-6"
      style={{
        background: "rgba(255,255,255,.045)",
        border: "1.5px dashed rgba(255,255,255,.16)",
      }}
    >
      <div className="flex items-center gap-3 mb-5">
        <span
          className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ color: "#07111F", background: "#FFF5A8", transform: "rotate(-3deg)" }}
        >
          <BookOpen className="w-5 h-5" />
        </span>
        <div>
          <p className="font-pixel text-[8px] text-amber-300">QUICK GUIDE</p>
          <h2 className="font-sketch text-xl font-bold text-[#F5F7FF] mt-1">
            三分钟看懂行动救援
          </h2>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {guides.map((guide, index) => (
          <div
            key={guide.number}
            className="rounded-2xl p-4 relative"
            style={{
              background: "rgba(9,15,31,.55)",
              border: `1.5px solid ${guide.accent}35`,
              boxShadow: `2px 3px 0 ${guide.accent}18`,
              transform: `rotate(${index === 1 ? 0.35 : -0.4}deg)`,
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-pixel text-[8px]" style={{ color: guide.accent }}>
                {guide.number}
              </span>
              <span style={{ color: guide.accent }}>{guide.icon}</span>
            </div>
            <h3 className="font-hand text-sm font-bold text-[#F5F7FF]">
              {guide.title}
            </h3>
            <p className="font-hand text-xs text-white/45 leading-relaxed mt-2">
              {guide.body}
            </p>
          </div>
        ))}
      </div>
      <div
        className="mt-4 rounded-2xl px-4 py-3 flex items-start gap-3"
        style={{ background: "rgba(78,205,196,.08)", border: "1px dashed rgba(78,205,196,.35)" }}
      >
        <Eye className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#4ECDC4" }} />
        <p className="font-hand text-xs text-white/50">
          检测只保存在浏览器本地；不会上传网址历史。关闭 WhyWait 页面后，只要浏览器扩展仍开启，小精灵会继续待在浏览器网页里。
        </p>
      </div>
    </section>
  );
}

function TaskEditor({
  tasks,
  steps,
  selectedTaskId,
  selectedSubTaskId,
  taskDraft,
  stepDraft,
  setTaskDraft,
  setStepDraft,
  setSelectedTaskId,
  setSelectedSubTaskId,
  onClose,
  onSave,
}: {
  tasks: Task[];
  steps: SubTask[];
  selectedTaskId: string;
  selectedSubTaskId: string;
  taskDraft: string;
  stepDraft: string;
  setTaskDraft: (value: string) => void;
  setStepDraft: (value: string) => void;
  setSelectedTaskId: (taskId: string) => void;
  setSelectedSubTaskId: (subTaskId: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      style={{ background: "rgba(4,8,19,.78)", backdropFilter: "blur(10px)" }}
      onClick={onClose}
    >
      <motion.form
        initial={{ opacity: 0, y: 18, rotate: -1 }}
        animate={{ opacity: 1, y: 0, rotate: -0.5 }}
        exit={{ opacity: 0, y: 18 }}
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
        className="relative w-full max-w-lg p-6"
        style={{
          color: "#2B3A67",
          background: "#FFF9E8",
          border: "2px solid rgba(43,58,103,.26)",
          borderRadius: "22px 14px 24px 13px / 14px 22px 12px 20px",
          boxShadow: "7px 9px 0 rgba(0,0,0,.2)",
        }}
      >
        <span
          className="doodle-tape"
          style={{ top: "-10px", left: "40%", transform: "rotate(-3deg)" }}
        />
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="font-pixel text-[8px]" style={{ color: "#FF6B35" }}>
              CHANGE MISSION
            </p>
            <h2 className="font-sketch text-2xl font-bold mt-2">换一个大任务</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "rgba(43,58,103,.09)" }}
            aria-label="关闭换任务窗口"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {tasks.length > 0 ? (
          <>
            <label className="block font-hand text-sm font-bold mb-1.5">
              选择已有任务
            </label>
            <select
              value={selectedTaskId}
              onChange={(event) => setSelectedTaskId(event.target.value)}
              className="w-full px-4 py-3 rounded-xl mb-4 font-hand"
              style={{
                color: "#2B3A67",
                background: "#fffdf7",
                border: "1.5px solid rgba(43,58,103,.2)",
              }}
            >
              <option value="">请选择任务</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>

            <label className="block font-hand text-sm font-bold mb-1.5">
              选择要执行的步骤
            </label>
            <select
              value={selectedSubTaskId}
              onChange={(event) => setSelectedSubTaskId(event.target.value)}
              disabled={!selectedTaskId}
              className="w-full px-4 py-3 rounded-xl font-hand disabled:opacity-45"
              style={{
                color: "#2B3A67",
                background: "#fffdf7",
                border: "1.5px solid rgba(43,58,103,.2)",
              }}
            >
              <option value="">
                {selectedTaskId ? "请选择下一步" : "先选择任务"}
              </option>
              {steps.map((subTask, index) => (
                <option key={subTask.id} value={subTask.id}>
                  {subTask.status === "completed" ? "✓ " : `${index + 1}. `}
                  {subTask.title}
                </option>
              ))}
            </select>
            {selectedTaskId && steps.length === 0 && (
              <p className="font-hand text-xs text-[#FF6B35] mt-3">
                这个任务还没有拆解步骤，请先去任务管理执行 AI 拆解。
              </p>
            )}
          </>
        ) : (
          <>
            <label className="block font-hand text-sm font-bold mb-1.5">
              还没有任务，先临时创建一个
            </label>
            <input
              value={taskDraft}
              onChange={(event) => setTaskDraft(event.target.value)}
              placeholder="例如：毕业论文"
              className="w-full px-4 py-3 rounded-xl mb-4 font-hand"
              style={{
                color: "#2B3A67",
                background: "#fffdf7",
                border: "1.5px solid rgba(43,58,103,.2)",
              }}
            />
            <input
              value={stepDraft}
              onChange={(event) => setStepDraft(event.target.value)}
              placeholder="例如：打开 Word，输入论文标题"
              className="w-full px-4 py-3 rounded-xl font-hand"
              style={{
                color: "#2B3A67",
                background: "#fffdf7",
                border: "1.5px solid rgba(43,58,103,.2)",
              }}
            />
          </>
        )}

        <div className="grid grid-cols-2 gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="py-3 rounded-xl font-hand font-bold"
            style={{ background: "rgba(43,58,103,.09)" }}
          >
            先不改
          </button>
          <button
            type="submit"
            disabled={
              tasks.length > 0 && (!selectedTaskId || !selectedSubTaskId)
            }
            className="py-3 rounded-xl font-hand font-bold"
            style={{
              color: "#fff",
              background: "#FF6B35",
              boxShadow: "0 4px 0 #C04A1E",
            }}
          >
            开始这个步骤
          </button>
        </div>
      </motion.form>
    </motion.div>,
    document.body
  );
}

function ConfettiBurst({ accent }: { accent: string }) {
  const pieces = [
    [-90, -55, "#FF6B35"],
    [-40, -95, "#F5B942"],
    [20, -105, "#4ECDC4"],
    [78, -66, "#7DD3FC"],
    [105, -15, "#A78BFA"],
    [80, 48, "#FF6B35"],
    [18, 78, "#F5B942"],
    [-48, 72, "#4ECDC4"],
    [-102, 28, "#A78BFA"],
    [-116, -14, accent],
  ] as const;

  return (
    <div className="fixed inset-0 z-[80] pointer-events-none flex items-center justify-center">
      {pieces.map(([x, y, color], index) => (
        <motion.span
          key={`${x}-${y}`}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.7 }}
          animate={{ x, y, opacity: 0, scale: 1.15, rotate: index * 47 }}
          transition={{ duration: 1.1 + index * 0.04, ease: "easeOut" }}
          className="absolute w-2.5 h-4 rounded-sm"
          style={{ background: color }}
        />
      ))}
    </div>
  );
}
