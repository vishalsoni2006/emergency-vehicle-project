import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import EmergencyBanner from '../components/EmergencyBanner';
import DemoControls from '../components/DemoControls';
import TrafficJunction from '../components/TrafficJunction';
import TrafficControlStatus from '../components/TrafficControlStatus';
import DetectionTimeline from '../components/DetectionTimeline';
import VideoUploadCard from '../components/VideoUploadCard';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import { useTrafficController } from '../hooks/useTrafficController';
import { apiService } from '../services/api';
import { TRAFFIC_CONFIG } from '../config/trafficConfig';
import { Video, Shield } from 'lucide-react';

export default function Dashboard() {
  const {
    mode,
    signals,
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
  } = useTrafficController();

  const [backendMetrics, setBackendMetrics] = useState(null);
  const [confusionMatrix, setConfusionMatrix] = useState(null);
  const [lastSummary, setLastSummary] = useState(null);

  // Keep track of the last emergency event for the final summary card
  useEffect(() => {
    if (emergencyData && emergencyData.active) {
      setLastSummary({
        laneId: emergencyData.laneId,
        roadName: emergencyData.roadName,
        signalId: emergencyData.signalId,
        confidence: emergencyData.confidence,
      });
    }
  }, [emergencyData]);

  // Attempt to fetch model metrics from backend on mount
  useEffect(() => {
    let isMounted = true;
    apiService.fetchModelMetrics().then((data) => {
      if (isMounted && data) {
        if (data.metrics) setBackendMetrics(data.metrics);
        if (data.confusion_matrix) setConfusionMatrix(data.confusion_matrix);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-command-darkest text-slate-100 flex flex-col">
      {/* 1. Header Bar */}
      <Header
        mode={mode}
        analytics={analytics}
        demoMode={demoMode}
        setDemoMode={setDemoMode}
        onReset={resetSimulation}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* 2. Emergency Override Alert Banner */}
        <EmergencyBanner
          emergencyData={emergencyData}
          onClearEmergency={clearEmergency}
        />

        {/* 3. Demo Mode Quick Simulation Bar */}
        <DemoControls
          demoMode={demoMode}
          setDemoMode={setDemoMode}
          isEmergency={mode === 'EMERGENCY'}
          onSimulateAmbulance={(laneId, conf) => activateEmergency(laneId, conf)}
          onClearEmergency={clearEmergency}
        />

        {/* 4. Main Control Center Grid (Junction + Telemetry Panels) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Central Intersection Visualizer (7 Columns) */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <TrafficJunction
              signals={signals}
              emergencyData={emergencyData}
              mode={mode}
            />
          </div>

          {/* Right Telemetry Stack (5 Columns: Traffic Control Status + Detection Timeline) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <TrafficControlStatus
              signals={signals}
              mode={mode}
              emergencyData={emergencyData}
            />

            <DetectionTimeline events={timelineEvents} />
          </div>
        </div>

        {/* 5. 8 CCTV Video Upload Sections Grid */}
        <section className="pt-4">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg md:text-xl font-black font-display text-white uppercase tracking-tight">
                CCTV Lane Video Feeds (8 Surveillance Channels)
              </h2>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              4 ROADS • 8 LANES INBOUND
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((laneId) => {
              const laneConfig = TRAFFIC_CONFIG.LANES[laneId];
              const isLaneEmergency = emergencyData?.laneId === laneId;

              return (
                <VideoUploadCard
                  key={laneId}
                  laneId={laneId}
                  roadName={laneConfig.roadName}
                  isEmergencyActive={isLaneEmergency}
                  demoMode={demoMode}
                  onAmbulanceDetected={(id, conf, dets) => activateEmergency(id, conf, dets)}
                  onAmbulanceCleared={clearEmergency}
                  onVideoProcessed={recordVideoProcessed}
                  onLogEvent={logEvent}
                />
              );
            })}
          </div>
        </section>

        {/* 6. Comprehensive Analytics Dashboard & Model Performance Results */}
        <section className="pt-4">
          <AnalyticsDashboard
            analytics={analytics}
            lastEmergencySummary={lastSummary}
            backendMetrics={backendMetrics}
            confusionMatrix={confusionMatrix}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full glass-panel border-t border-white/5 py-4 text-center text-xs font-mono text-slate-400">
        Emergency Vehicle Project • College Engineering Demo Dashboard
      </footer>
    </div>
  );
}
