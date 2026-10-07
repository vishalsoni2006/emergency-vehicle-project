/**
 * API Service Layer for AI-Based Emergency Traffic Signal Management System
 * 
 * Communicates with the existing Python/YOLO detection backend.
 * Base URL configurable via VITE_API_URL environment variable.
 */

import { TRAFFIC_CONFIG } from '../config/trafficConfig';

const API_BASE_URL = TRAFFIC_CONFIG.API.BASE_URL;

class TrafficApiService {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  /**
   * Check connection status of the backend API
   */
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}${TRAFFIC_CONFIG.API.ENDPOINTS.HEALTH}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      if (!response.ok) throw new Error(`Health check returned ${response.status}`);
      return await response.json();
    } catch (error) {
      return { online: false, error: error.message };
    }
  }

  /**
   * Send video file for a specific lane to the AI detection model
   * 
   * @param {File} videoFile - The video file to process
   * @param {number} laneId - The lane ID (1 through 8)
   * @param {function} onProgress - Optional callback for upload progress
   * @returns {Promise<Object>} Detection response
   */
  async detectAmbulance(videoFile, laneId, onProgress = null) {
    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('lane_id', laneId.toString());

    try {
      // Primary endpoint: POST /detect
      // Fallback endpoint supported: POST /process-video
      let endpoint = `${this.baseUrl}${TRAFFIC_CONFIG.API.ENDPOINTS.DETECT}`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        // Attempt secondary endpoint if 404
        if (response.status === 404) {
          const fallbackEndpoint = `${this.baseUrl}${TRAFFIC_CONFIG.API.ENDPOINTS.PROCESS_VIDEO}`;
          const fallbackRes = await fetch(fallbackEndpoint, {
            method: 'POST',
            body: formData,
          });
          if (!fallbackRes.ok) {
            throw new Error(`API error (${fallbackRes.status}): ${fallbackRes.statusText}`);
          }
          return await fallbackRes.json();
        }
        throw new Error(`API error (${response.status}): ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.warn(`[TrafficApiService] Connection error on lane ${laneId}:`, error);
      throw error;
    }
  }

  /**
   * Fetch model evaluation performance metrics (Precision, Recall, mAP) from backend
   */
  async fetchModelMetrics() {
    try {
      const response = await fetch(`${this.baseUrl}${TRAFFIC_CONFIG.API.ENDPOINTS.METRICS}`, {
        method: 'GET',
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      return null;
    }
  }
}

export const apiService = new TrafficApiService();
export default apiService;
