import React, { useState, useRef } from 'react';
import { Upload, Video, CheckCircle2, AlertTriangle, Loader2, Sparkles, X } from 'lucide-react';
import { apiService } from '../services/api';

/**
 * CCTV Lane Video Upload Card Component
 * 
 * Supports:
 * - Drag and drop video file selection
 * - Video player preview
 * - Progress lifecycle: IDLE -> UPLOADING -> PROCESSING -> AI DETECTION -> COMPLETE
 * - Bounding box visualization overlay
 * - Real API integration via apiService.detectAmbulance(file, laneId)
 * - Demo mode instant trigger
 */
export default function VideoUploadCard({
  laneId,
  roadName = `Road`,
  isEmergencyActive = false,
  demoMode = false,
  onAmbulanceDetected,
  onAmbulanceCleared,
  onVideoProcessed,
  onLogEvent,
}) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [status, setStatus] = useState('IDLE'); // 'IDLE' | 'UPLOADING' | 'PROCESSING' | 'AI_DETECTION' | 'COMPLETE'
  const [detectionResult, setDetectionResult] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileChange = (selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith('video/')) {
      alert('Please upload a valid video file (.mp4, .mov, .avi).');
      return;
    }

    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    setStatus('IDLE');
    setDetectionResult(null);

    // Automatically trigger processing
    processVideo(selectedFile);
  };

  // Video processing pipeline
  const processVideo = async (videoFile) => {
    try {
      // 1. Uploading state
      setStatus('UPLOADING');
      onLogEvent?.(`CCTV Lane ${laneId}: Uploading ${videoFile.name}...`, 'info');
      await new Promise(r => setTimeout(r, 600));

      // 2. Processing state
      setStatus('PROCESSING');
      onLogEvent?.(`CCTV Lane ${laneId}: Running frame extraction & decoding...`, 'info');
      await new Promise(r => setTimeout(r, 800));

      // 3. AI Detection state
      setStatus('AI_DETECTION');
      onLogEvent?.(`CCTV Lane ${laneId}: YOLOv11 Neural Detection & HSV Siren scan in progress...`, 'info');

      // Attempt real backend call
      let result = null;
      try {
        result = await apiService.detectAmbulance(videoFile, laneId);
      } catch (err) {
        // If backend offline and demoMode is active, synthesize a valid sample response
        if (demoMode) {
          console.info(`[Demo Mode] Backend unreachable. Simulating AI detection for Lane ${laneId}...`);
          await new Promise(r => setTimeout(r, 700));
          // Alternate detection behavior based on lane for realistic variety
          const isAmbulanceSample = (laneId === 1 || laneId === 5 || laneId === 3);
          result = {
            ambulance_detected: isAmbulanceSample,
            confidence: isAmbulanceSample ? 0.946 : 0.0,
            lane_id: laneId,
            road_id: Math.ceil(laneId / 2),
            signal_id: Math.ceil(laneId / 2),
            emergency: isAmbulanceSample,
            detections: isAmbulanceSample ? [{ frame: 120, confidence: 0.946 }] : []
          };
        } else {
          throw err;
        }
      }

      // 4. Complete state
      setStatus('COMPLETE');
      setDetectionResult(result);
      onVideoProcessed?.(300, 10, result.ambulance_detected ? result.confidence : null);

      if (result && result.ambulance_detected) {
        onAmbulanceDetected?.(laneId, result.confidence, result.detections);
      } else {
        onLogEvent?.(`CCTV Lane ${laneId}: Analysis complete. Normal traffic detected.`, 'info');
      }
    } catch (error) {
      console.error(`Error processing video on Lane ${laneId}:`, error);
      setStatus('COMPLETE');
      setDetectionResult({
        ambulance_detected: false,
        confidence: 0,
        error: error.message || 'Connection to detection model failed.'
      });
      onLogEvent?.(`CCTV Lane ${laneId}: Backend API unavailable (${error.message}). Use DEMO MODE for mock testing.`, 'warning');
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Demo Simulation Trigger
  const triggerDemoSimulation = (simulateAmbulance = true) => {
    setStatus('PROCESSING');
    setTimeout(() => {
      setStatus('AI_DETECTION');
      setTimeout(() => {
        setStatus('COMPLETE');
        const res = {
          ambulance_detected: simulateAmbulance,
          confidence: simulateAmbulance ? 0.946 : 0.0,
          lane_id: laneId,
          emergency: simulateAmbulance,
        };
        setDetectionResult(res);
        onVideoProcessed?.(300, 10, simulateAmbulance ? 0.946 : null);

        if (simulateAmbulance) {
          onAmbulanceDetected?.(laneId, 0.946, [{ frame: 120, confidence: 0.946 }]);
        } else {
          onLogEvent?.(`CCTV Lane ${laneId}: Simulated normal traffic — no ambulance detected.`, 'info');
        }
      }, 700);
    }, 600);
  };

  const hasAmbulance = detectionResult?.ambulance_detected;

  return (
    <div
      className={`glass-panel rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 relative ${
        isEmergencyActive
          ? 'emergency-pulse-border bg-rose-950/25 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
          : hasAmbulance
            ? 'border-rose-500/60 bg-rose-950/15'
            : 'border-white/10 hover:border-white/20'
      }`}
    >
      {/* Top Card Header */}
      <div>
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10">
          <div>
            <span className="text-xs font-black font-display text-white tracking-wider">
              CCTV LANE {laneId}
            </span>
            <span className="text-[10px] font-mono text-slate-400 block">
              {roadName}
            </span>
          </div>

          {/* Status Badge */}
          {status === 'IDLE' && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              STANDBY
            </span>
          )}
          {status === 'UPLOADING' && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Loader2 className="w-2.5 h-2.5 animate-spin" /> UPLOADING
            </span>
          )}
          {status === 'PROCESSING' && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
              <Loader2 className="w-2.5 h-2.5 animate-spin" /> PROCESSING
            </span>
          )}
          {status === 'AI_DETECTION' && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1 animate-pulse">
              <Loader2 className="w-2.5 h-2.5 animate-spin" /> AI SCANNING
            </span>
          )}
          {status === 'COMPLETE' && (
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
              hasAmbulance
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
            }`}>
              {hasAmbulance ? '🚨 AMBULANCE' : 'NORMAL'}
            </span>
          )}
        </div>

        {/* Video Preview or Drag & Drop Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative w-full aspect-video rounded-xl overflow-hidden border transition-all flex flex-col items-center justify-center ${
            isDragging
              ? 'border-cyan-400 bg-cyan-950/30'
              : previewUrl
                ? 'border-white/10 bg-black'
                : 'border-dashed border-white/15 bg-slate-900/40 hover:bg-slate-900/60'
          }`}
        >
          {previewUrl ? (
            <div className="relative w-full h-full">
              <video
                src={previewUrl}
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              />

              {/* Bounding Box Visualizer Overlay */}
              {hasAmbulance && (
                <div className="absolute inset-4 border-2 border-rose-500 rounded-md pointer-events-none shadow-[0_0_15px_#f43f5e] flex flex-col justify-start">
                  <div className="bg-rose-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 self-start rounded-br shadow">
                    AMBULANCE {((detectionResult?.confidence || 0.946) * 100).toFixed(1)}%
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-3">
              <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1 opacity-70" />
              <div className="text-[11px] font-medium text-slate-300">
                Drag CCTV Video Here
              </div>
              <div className="text-[9px] text-slate-400 mt-0.5">
                or click Upload Video below
              </div>
            </div>
          )}
        </div>

        {/* Filename Readout */}
        {file && (
          <div className="text-[10px] font-mono text-slate-400 truncate mt-1.5 flex items-center justify-between">
            <span className="truncate">📁 {file.name}</span>
            <button
              onClick={() => {
                setFile(null);
                setPreviewUrl(null);
                setStatus('IDLE');
                setDetectionResult(null);
              }}
              className="text-slate-400 hover:text-white ml-1"
              title="Remove video"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Detection Information Grid */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-white/5">
          <div className="bg-slate-950/60 p-2 rounded-lg border border-white/5">
            <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
              Ambulance
            </div>
            <div className={`text-xs font-mono font-bold mt-0.5 ${
              hasAmbulance ? 'text-rose-400 font-black' : 'text-slate-300'
            }`}>
              {status === 'IDLE' 
                ? 'STANDBY' 
                : hasAmbulance 
                  ? 'DETECTED' 
                  : 'NOT DETECTED'}
            </div>
          </div>

          <div className="bg-slate-950/60 p-2 rounded-lg border border-white/5">
            <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
              Confidence
            </div>
            <div className="text-xs font-mono font-bold text-cyan-300 mt-0.5">
              {hasAmbulance 
                ? `${((detectionResult?.confidence || 0) * 100).toFixed(1)}%` 
                : '--'}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-3 flex flex-col gap-1.5">
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files?.[0])}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={status === 'PROCESSING' || status === 'AI_DETECTION'}
          className="w-full py-1.5 px-3 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 active:scale-[0.98] border border-slate-600 text-white flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
        >
          <Upload className="w-3.5 h-3.5" />
          Upload Video
        </button>

        {/* Demo Mode Quick Simulation Trigger */}
        {demoMode && (
          <button
            onClick={() => triggerDemoSimulation(true)}
            className="w-full py-1 px-2 rounded-lg text-[10px] font-mono font-bold bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 transition-all flex items-center justify-center gap-1"
            title="Simulate ambulance detection for Lane testing"
          >
            <Sparkles className="w-3 h-3" />
            Simulate Ambulance (Lane {laneId})
          </button>
        )}
      </div>
    </div>
  );
}
