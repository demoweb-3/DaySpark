import { useCallback, useEffect, useRef, useState } from 'react';

export type TimerPhase = 'focus' | 'short-break' | 'long-break';
export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';

export interface TimerConfig {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLongBreak: number;
  autoStartBreaks: boolean;
  soundEnabled: boolean;
}

interface SavedState {
  phase: TimerPhase;
  status: TimerStatus;
  remainingSeconds: number;
  elapsedSeconds: number;
  completedFocusSessions: number;
  activeTaskId: string | null;
  savedAt: number;
}

const STATE_KEY = 'dayspark-focus-state';

function loadSavedState(): SavedState | null {
  try {
    const raw = sessionStorage.getItem(STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedState;
  } catch {
    return null;
  }
}

function saveState(state: SavedState) {
  try {
    sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    // Non-fatal
  }
}

function clearState() {
  try {
    sessionStorage.removeItem(STATE_KEY);
  } catch {
    // Non-fatal
  }
}

function phaseDuration(phase: TimerPhase, config: TimerConfig): number {
  switch (phase) {
    case 'focus': return config.focusMinutes * 60;
    case 'short-break': return config.shortBreakMinutes * 60;
    case 'long-break': return config.longBreakMinutes * 60;
  }
}

function playChime(soundEnabled: boolean) {
  if (!soundEnabled) return;
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
    osc.onended = () => ctx.close();
  } catch {
    // Audio not available
  }
}

export function useTimer(config: TimerConfig) {
  const [phase, setPhase] = useState<TimerPhase>('focus');
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [remainingSeconds, setRemainingSeconds] = useState(config.focusMinutes * 60);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [completedFocusSessions, setCompletedFocusSessions] = useState(0);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef(0);
  const statusRef = useRef(status);
  const phaseRef = useRef(phase);
  const remainingRef = useRef(remainingSeconds);
  const elapsedRef = useRef(elapsedSeconds);
  const configRef = useRef(config);
  const sessionsRef = useRef(completedFocusSessions);
  const activeTaskRef = useRef(activeTaskId);
  const autoStartRef = useRef(config.autoStartBreaks);

  // Keep refs in sync
  statusRef.current = status;
  phaseRef.current = phase;
  remainingRef.current = remainingSeconds;
  elapsedRef.current = elapsedSeconds;
  configRef.current = config;
  sessionsRef.current = completedFocusSessions;
  activeTaskRef.current = activeTaskId;
  autoStartRef.current = config.autoStartBreaks;

  // Restore saved state on mount
  useEffect(() => {
    const saved = loadSavedState();
    if (saved) {
      // Calculate drift since save
      const elapsedSinceSave = Math.floor((Date.now() - saved.savedAt) / 1000);

      setPhase(saved.phase);
      setStatus(saved.status);
      setCompletedFocusSessions(saved.completedFocusSessions);
      setActiveTaskId(saved.activeTaskId);

      if (saved.status === 'running') {
        const newRemaining = Math.max(0, saved.remainingSeconds - elapsedSinceSave);
        const newElapsed = saved.elapsedSeconds + Math.min(elapsedSinceSave, saved.remainingSeconds);
        setRemainingSeconds(newRemaining);
        setElapsedSeconds(newElapsed);
        if (newRemaining <= 0) {
          // It finished while away
          handlePhaseComplete();
        }
      } else {
        setRemainingSeconds(saved.remainingSeconds);
        setElapsedSeconds(saved.elapsedSeconds);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update duration when config changes and timer is idle
  useEffect(() => {
    if (status === 'idle') {
      setRemainingSeconds(phaseDuration(phase, config));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.focusMinutes, config.shortBreakMinutes, config.longBreakMinutes, phase]);

  // Persist state
  useEffect(() => {
    if (status === 'idle' && phase === 'focus' && completedFocusSessions === 0) {
      clearState();
    } else {
      saveState({
        phase,
        status,
        remainingSeconds,
        elapsedSeconds,
        completedFocusSessions,
        activeTaskId,
        savedAt: Date.now(),
      });
    }
  }, [phase, status, remainingSeconds, elapsedSeconds, completedFocusSessions, activeTaskId]);

  // Timer tick
  useEffect(() => {
    if (status !== 'running') {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      tickRef.current++;
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          // Phase complete
          handlePhaseComplete();
          return 0;
        }
        return prev - 1;
      });
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  function handlePhaseComplete() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    playChime(configRef.current.soundEnabled);

    if (phaseRef.current === 'focus') {
      const newSessions = sessionsRef.current + 1;
      setCompletedFocusSessions(newSessions);
      const nextPhase: TimerPhase = newSessions % configRef.current.sessionsBeforeLongBreak === 0
        ? 'long-break'
        : 'short-break';
      setPhase(nextPhase);
      setRemainingSeconds(phaseDuration(nextPhase, configRef.current));
      setElapsedSeconds(0);
      setStatus(autoStartRef.current ? 'running' : 'finished');
    } else {
      setPhase('focus');
      setRemainingSeconds(phaseDuration('focus', configRef.current));
      setElapsedSeconds(0);
      setStatus(autoStartRef.current ? 'running' : 'finished');
    }
  }

  const start = useCallback(() => {
    if (status === 'finished') {
      setStatus('running');
    } else if (status === 'idle' || status === 'paused') {
      setStatus('running');
    }
  }, [status]);

  const pause = useCallback(() => {
    setStatus('paused');
  }, []);

  const resume = useCallback(() => {
    setStatus('running');
  }, []);

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setStatus('idle');
    setRemainingSeconds(phaseDuration(phase, configRef.current));
    setElapsedSeconds(0);
  }, [phase]);

  const skipPhase = useCallback(() => {
    handlePhaseComplete();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchPhase = useCallback((newPhase: TimerPhase) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setPhase(newPhase);
    setStatus('idle');
    setRemainingSeconds(phaseDuration(newPhase, configRef.current));
    setElapsedSeconds(0);
  }, []);

  const setActiveTask = useCallback((taskId: string | null) => {
    setActiveTaskId(taskId);
  }, []);

  const totalSeconds = phaseDuration(phase, config);

  return {
    phase,
    status,
    remainingSeconds,
    elapsedSeconds,
    totalSeconds,
    completedFocusSessions,
    activeTaskId,
    start,
    pause,
    resume,
    reset,
    skipPhase,
    switchPhase,
    setActiveTask,
  };
}
