/**
 * Traffic Configuration & Junction Mapping Constants
 * 
 * 4 Roads, 8 Lanes, 4 Traffic Signals
 * - Road 1 (North): Lanes 1 & 2 -> Signal 1
 * - Road 2 (East):  Lanes 3 & 4 -> Signal 2
 * - Road 3 (South): Lanes 5 & 6 -> Signal 3
 * - Road 4 (West):  Lanes 7 & 8 -> Signal 4
 */

export const TRAFFIC_CONFIG = {
  // Configurable Signal Cycle Timings (in seconds)
  TIMINGS: {
    GREEN_DURATION: 10,       // Standard green light duration
    YELLOW_DURATION: 3,       // Safety transition amber light
    CLEARANCE_BUFFER: 3,      // Post-ambulance clearance before returning to normal cycle
    TICK_INTERVAL_MS: 200,    // Controller state machine interval in ms
  },

  // API Backend configuration
  API: {
    BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    ENDPOINTS: {
      DETECT: '/detect',
      PROCESS_VIDEO: '/process-video',
      METRICS: '/metrics',
      HEALTH: '/health',
    }
  },

  // Road Definitions
  ROADS: {
    1: { id: 1, name: 'Road 1 (North)', compass: 'NORTH', signalId: 1, lanes: [1, 2] },
    2: { id: 2, name: 'Road 2 (East)',  compass: 'EAST',  signalId: 2, lanes: [3, 4] },
    3: { id: 3, name: 'Road 3 (South)', compass: 'SOUTH', signalId: 3, lanes: [5, 6] },
    4: { id: 4, name: 'Road 4 (West)',  compass: 'WEST',  signalId: 4, lanes: [7, 8] },
  },

  // Signals (1 per Road)
  SIGNALS: {
    1: { id: 1, roadId: 1, name: 'Signal 1 (North Gate)' },
    2: { id: 2, roadId: 2, name: 'Signal 2 (East Gate)' },
    3: { id: 3, roadId: 3, name: 'Signal 3 (South Gate)' },
    4: { id: 4, roadId: 4, name: 'Signal 4 (West Gate)' },
  },

  // 8 Lanes
  LANES: {
    1: { id: 1, roadId: 1, signalId: 1, name: 'CCTV Lane 1', type: 'Straight / Inbound', roadName: 'Road 1' },
    2: { id: 2, roadId: 1, signalId: 1, name: 'CCTV Lane 2', type: 'Turn / Inbound',     roadName: 'Road 1' },
    3: { id: 3, roadId: 2, signalId: 2, name: 'CCTV Lane 3', type: 'Straight / Inbound', roadName: 'Road 2' },
    4: { id: 4, roadId: 2, signalId: 2, name: 'CCTV Lane 4', type: 'Turn / Inbound',     roadName: 'Road 2' },
    5: { id: 5, roadId: 3, signalId: 3, name: 'CCTV Lane 5', type: 'Straight / Inbound', roadName: 'Road 3' },
    6: { id: 6, roadId: 3, signalId: 3, name: 'CCTV Lane 6', type: 'Turn / Inbound',     roadName: 'Road 3' },
    7: { id: 7, roadId: 4, signalId: 4, name: 'CCTV Lane 7', type: 'Straight / Inbound', roadName: 'Road 4' },
    8: { id: 8, roadId: 4, signalId: 4, name: 'CCTV Lane 8', type: 'Turn / Inbound',     roadName: 'Road 4' },
  },

  // Normal mode round-robin sequence of active roads
  CYCLE_SEQUENCE: [1, 2, 3, 4],
};

/**
 * Utility helper: Get Road & Signal from Lane ID
 */
export function getRoadAndSignalForLane(laneId) {
  const lane = TRAFFIC_CONFIG.LANES[laneId];
  if (!lane) return { roadId: null, signalId: null, roadName: '' };
  return {
    roadId: lane.roadId,
    signalId: lane.signalId,
    roadName: lane.roadName,
    laneName: lane.name,
  };
}
