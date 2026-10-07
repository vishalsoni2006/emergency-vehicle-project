import { useState, useEffect, useRef, useCallback } from 'react';
import { TRAFFIC_CONFIG, getRoadAndSignalForLane } from '../config/trafficConfig';

export function useTrafficController() {
  // Traffic controller state
  const [mode, setMode] = useState('NORMAL'); // 'NORMAL' | 'EMERGENCY'
  
  // 4 Signal states: each has state ('RED' | 'YELLOW' | 'GREEN') and timer in seconds
  const [signals, setSignals] = useState({
    1: { id: 1, state: 'GREEN', timer: TRAFFIC_CONFIG.TIMINGS.GREEN_DURATION, roadId: 1 },
    2: { id: 2, state: 'RED',   timer: 0, roadId: 2 },
    3: { id: 3, state: 'RED',   timer: 0, roadId: 3 },
    4: { id: 4, state: 'RED',   timer: 0, roadId: 4 },
  });

  // Cyclic progression state
  const [currentRoadIndex, setCurrentRoadIndex] = useState(0); // 0 -> Road 1, 1 -> Road 2, etc.
  const [currentPhase, setCurrentPhase] = useState('GREEN');    // 'GREEN' | 'YELLOW'
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(TRAFFIC_CONFIG.TIMINGS.GREEN_DURATION);

  // Active Emergency Data
  const [emergencyData, setEmergencyData] = useState(null);
  // Example: { active: true, laneId: 5, roadId: 3, signalId: 3, confidence: 0.946, startTime: Date.now(), detections: [] }

  // Timeline events log
  const [timelineEvents, setTimelineEvents] = useState([
    {
      id: 1,
      time: '00:00',
      timestamp: Date.now(),
      text: 'System Initialized. Junction operating in NORMAL mode.',
      type: 'info'
    }
  ]);

  // Demo Mode toggle
  const [demoMode, setDemoMode] = useState(true); // Default to true so user can test immediately

  // Analytics aggregations
  const [analytics, setAnalytics] = useState({
    totalVideosProcessed: 0,
    totalFrames: 0,
    ambulanceDetections: 0,
    confidenceList: [],
    emergencyEventsCount: 0,
    totalEmergencyDurationSec: 0,
    fps: 32.4,
    processingTimeSec: 0,
  });

  // Track start time for timeline offsets
  const sessionStartTimeRef = useRef(Date.now());
  const emergencyStartTimestampRef = useRef(null);

  // Helper to format offset time (e.g. "00:04")
  const getFormattedOffset = useCallback(() => {
    const elapsedSec = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);
    const mins = Math.floor(elapsedSec / 60).toString().padStart(2, '0');
    const secs = (elapsedSec % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }, []);

  // Helper to add timeline event
  const logEvent = useCallback((text, type = 'info', meta = {}) => {
    setTimelineEvents(prev => [
      {
        id: Date.now() + Math.random(),
        time: getFormattedOffset(),
        timestamp: Date.now(),
        text,
        type,
        ...meta
      },
      ...prev.slice(0, 49) // Keep last 50 events
    ]);
  }, [getFormattedOffset]);

  // Trigger Emergency Priority
  const activateEmergency = useCallback((laneId, confidence = 0.946, detections = []) => {
    const { roadId, signalId, roadName, laneName } = getRoadAndSignalForLane(laneId);
    if (!roadId) return;

    setMode('EMERGENCY');
    emergencyStartTimestampRef.current = Date.now();

    const newEmergency = {
      active: true,
      laneId,
      laneName,
      roadId,
      roadName,
      signalId,
      confidence: typeof confidence === 'number' ? confidence : 0.946,
      startTime: Date.now(),
      detections
    };
    setEmergencyData(newEmergency);

    // Set corresponding signal to GREEN, all other signals to RED
    setSignals({
      1: { id: 1, state: signalId === 1 ? 'GREEN' : 'RED', timer: signalId === 1 ? 99 : 0, roadId: 1 },
      2: { id: 2, state: signalId === 2 ? 'GREEN' : 'RED', timer: signalId === 2 ? 99 : 0, roadId: 2 },
      3: { id: 3, state: signalId === 3 ? 'GREEN' : 'RED', timer: signalId === 3 ? 99 : 0, roadId: 3 },
      4: { id: 4, state: signalId === 4 ? 'GREEN' : 'RED', timer: signalId === 4 ? 99 : 0, roadId: 4 },
    });

    logEvent(`🚨 Ambulance detected in ${laneName} (${roadName})`, 'emergency', { laneId, confidence });
    logEvent(`Confidence: ${(newEmergency.confidence * 100).toFixed(1)}%`, 'detection', { confidence });
    logEvent(`Emergency priority activated: Signal ${signalId} set to GREEN. Cross-traffic RED.`, 'emergency-action');

    // Update analytics
    setAnalytics(prev => ({
      ...prev,
      ambulanceDetections: prev.ambulanceDetections + 1,
      emergencyEventsCount: prev.emergencyEventsCount + 1,
      confidenceList: [...prev.confidenceList, newEmergency.confidence]
    }));
  }, [logEvent]);

  // Deactivate Emergency & Return to Normal Cycle
  const clearEmergency = useCallback(() => {
    if (!emergencyData) return;

    const durationSec = emergencyStartTimestampRef.current 
      ? ((Date.now() - emergencyStartTimestampRef.current) / 1000) 
      : 5.0;

    logEvent(`Ambulance cleared from ${emergencyData.laneName}`, 'info');
    logEvent(`Emergency mode disabled. Clearing junction buffer...`, 'warning');

    // Post-clearance buffer then return to normal
    setTimeout(() => {
      setMode('NORMAL');
      setEmergencyData(null);
      emergencyStartTimestampRef.current = null;

      // Resume normal cycle on next road
      const nextIndex = (currentRoadIndex + 1) % TRAFFIC_CONFIG.CYCLE_SEQUENCE.length;
      setCurrentRoadIndex(nextIndex);
      setCurrentPhase('GREEN');
      setPhaseSecondsLeft(TRAFFIC_CONFIG.TIMINGS.GREEN_DURATION);

      logEvent(`Normal traffic cycle resumed. Priority returned to standard rotation.`, 'success');

      setAnalytics(prev => ({
        ...prev,
        totalEmergencyDurationSec: prev.totalEmergencyDurationSec + durationSec
      }));
    }, TRAFFIC_CONFIG.TIMINGS.CLEARANCE_BUFFER * 1000);
  }, [emergencyData, currentRoadIndex, logEvent]);

  // Reset Simulation to default factory state
  const resetSimulation = useCallback(() => {
    setMode('NORMAL');
    setEmergencyData(null);
    setCurrentRoadIndex(0);
    setCurrentPhase('GREEN');
    setPhaseSecondsLeft(TRAFFIC_CONFIG.TIMINGS.GREEN_DURATION);
    sessionStartTimeRef.current = Date.now();
    emergencyStartTimestampRef.current = null;

    setSignals({
      1: { id: 1, state: 'GREEN', timer: TRAFFIC_CONFIG.TIMINGS.GREEN_DURATION, roadId: 1 },
      2: { id: 2, state: 'RED',   timer: 0, roadId: 2 },
      3: { id: 3, state: 'RED',   timer: 0, roadId: 3 },
      4: { id: 4, state: 'RED',   timer: 0, roadId: 4 },
    });

    setTimelineEvents([
      {
        id: Date.now(),
        time: '00:00',
        timestamp: Date.now(),
        text: 'Simulation Reset. Junction returned to default NORMAL cycle.',
        type: 'info'
      }
    ]);

    setAnalytics({
      totalVideosProcessed: 0,
      totalFrames: 0,
      ambulanceDetections: 0,
      confidenceList: [],
      emergencyEventsCount: 0,
      totalEmergencyDurationSec: 0,
      fps: 32.4,
      processingTimeSec: 0,
    });
  }, []);

  // Normal Traffic Light State Machine Loop (Active only when mode === 'NORMAL')
  useEffect(() => {
    if (mode === 'EMERGENCY') return;

    const interval = setInterval(() => {
      setPhaseSecondsLeft(prevSec => {
        if (prevSec > 1) {
          const nextSec = prevSec - 1;
          // Update active signal timer display
          const activeRoadId = TRAFFIC_CONFIG.CYCLE_SEQUENCE[currentRoadIndex];
          setSignals(prevSignals => ({
            ...prevSignals,
            [activeRoadId]: { ...prevSignals[activeRoadId], timer: nextSec }
          }));
          return nextSec;
        }

        // Timer reached 0: Transition Phase
        if (currentPhase === 'GREEN') {
          // Transition from GREEN to YELLOW
          setCurrentPhase('YELLOW');
          const yellowDuration = TRAFFIC_CONFIG.TIMINGS.YELLOW_DURATION;
          const activeRoadId = TRAFFIC_CONFIG.CYCLE_SEQUENCE[currentRoadIndex];
          
          setSignals(prevSignals => ({
            ...prevSignals,
            [activeRoadId]: { id: activeRoadId, state: 'YELLOW', timer: yellowDuration, roadId: activeRoadId }
          }));
          return yellowDuration;
        } else {
          // Transition from YELLOW to next Road GREEN
          const nextRoadIdx = (currentRoadIndex + 1) % TRAFFIC_CONFIG.CYCLE_SEQUENCE.length;
          setCurrentRoadIndex(nextRoadIdx);
          setCurrentPhase('GREEN');
          
          const greenDuration = TRAFFIC_CONFIG.TIMINGS.GREEN_DURATION;
          const nextActiveRoadId = TRAFFIC_CONFIG.CYCLE_SEQUENCE[nextRoadIdx];

          setSignals(prevSignals => {
            const updated = {};
            [1, 2, 3, 4].forEach(rId => {
              if (rId === nextActiveRoadId) {
                updated[rId] = { id: rId, state: 'GREEN', timer: greenDuration, roadId: rId };
              } else {
                updated[rId] = { id: rId, state: 'RED', timer: 0, roadId: rId };
              }
            });
            return updated;
          });

          return greenDuration;
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [mode, currentPhase, currentRoadIndex]);

  // Record a video processed in analytics
  const recordVideoProcessed = useCallback((framesCount = 300, durationSec = 10, confidence = null) => {
    setAnalytics(prev => ({
      ...prev,
      totalVideosProcessed: prev.totalVideosProcessed + 1,
      totalFrames: prev.totalFrames + framesCount,
      processingTimeSec: prev.processingTimeSec + (framesCount / prev.fps),
      ...(confidence ? { confidenceList: [...prev.confidenceList, confidence] } : {})
    }));
  }, []);

  return {
    mode,
    signals,
    currentRoadIndex,
    currentPhase,
    phaseSecondsLeft,
    emergencyData,
    timelineEvents,
    demoMode,
    setDemoMode,
    analytics,
    activateEmergency,
    clearEmergency,
    resetSimulation,
    recordVideoProcessed,
    logEvent,
  };
}
