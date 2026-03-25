"use client";

import { useEffect, useRef, useState } from "react";
import {
    createDetector,
    SupportedModels,
    HandDetector
} from "@tensorflow-models/hand-pose-detection";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import { drawHands } from "@/lib/utils";
import { useAnimationFrame } from "@/lib/hooks/useAnimationFrame";
import * as tfjsWasm from "@tensorflow/tfjs-backend-wasm";
import { detectGesture, GestureType } from "@/lib/gestures";

const CONFIG = {
    TFJS_WASM_PATH: "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm",
    MEDIAPIPE_SOLUTION_PATH: "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240",
};

tfjsWasm.setWasmPaths(CONFIG.TFJS_WASM_PATH);

export function useHandDetector() {
    const detectorRef = useRef<HandDetector | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const [isReady, setIsReady] = useState(false);
    const [gesture, setGesture] = useState<GestureType>(GestureType.UNKNOWN);
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => setLogs(prev => [msg, ...prev.slice(0, 5)]);

    useEffect(() => {
        let active = true;

        async function init() {
            // Wait for refs to be attached
            if (!videoRef.current || !canvasRef.current) {
                console.log("Waiting for refs...");
                // We'll try again in the next effect run if dependencies change, 
                // but since refs don't trigger re-renders, we'll use a small timeout for safety
                const timer = setTimeout(init, 100);
                return () => clearTimeout(timer);
            }

            try {
                addLog("Camera: Requesting access...");
                const video = videoRef.current;
                if (!video) throw new Error("Video ref not found");

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 480 }, height: { ideal: 360 } } // Balanced resolution
                });

                if (!active) {
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }

                video.srcObject = stream;
                addLog("Camera: Access granted.");

                // Wait for video to be ready - More robust check
                addLog("Video: Initializing stream...");
                await new Promise<void>((resolve, reject) => {
                    const onReady = async () => {
                        try {
                            await video.play();
                            addLog("Video: Stream playback started.");
                            resolve();
                        } catch (e: any) {
                            reject(new Error(`Playback failed: ${e.message}`));
                        }
                    };

                    if (video.readyState >= 2) { // HAVE_CURRENT_DATA
                        onReady();
                    } else {
                        video.onloadeddata = onReady;
                        video.onerror = () => reject(new Error("Video error occurred"));
                    }
                });

                if (!active) return;

                video.width = video.videoWidth || 480;
                video.height = video.videoHeight || 360;

                const canvas = canvasRef.current;
                if (canvas) {
                    canvas.width = video.width;
                    canvas.height = video.height;
                }

                addLog("ML: Loading detection model...");
                try {
                    try {
                        addLog("ML: Trying MediaPipe runtime...");
                        detectorRef.current = await createDetector(SupportedModels.MediaPipeHands, {
                            runtime: "mediapipe",
                            solutionPath: CONFIG.MEDIAPIPE_SOLUTION_PATH,
                            modelType: "lite", // Use lite model for better performance
                            maxHands: 1 // Only one hand needed for the game
                        });
                    } catch (mediapipeErr) {
                        console.warn("MediaPipe runtime failed, falling back to tfjs:", mediapipeErr);
                        addLog("ML: Falling back to TFJS runtime...");
                        detectorRef.current = await createDetector(SupportedModels.MediaPipeHands, {
                            runtime: "tfjs",
                            modelType: "full"
                        });
                    }
                    addLog("ML: Model loaded successfully.");
                } catch (mlErr: any) {
                    console.error("ML Loading Error:", mlErr);
                    throw new Error(`Model load failed: ${mlErr.message || "Unknown ML error"}`);
                }

                if (!active) return;
                setIsReady(true);
                addLog(`System: Ready (${tf.getBackend()}).`);
                console.log("TFJS Backend:", tf.getBackend());
            } catch (err: any) {
                console.error("Initialization Error:", err);
                addLog(`Error: ${err.message || "Initialization failed"}`);
            }
        }

        init();
        return () => { active = false; };
    }, []);

    const lastGestureRef = useRef<GestureType>(GestureType.UNKNOWN);
    const isProcessingRef = useRef(false);
    const frameCountRef = useRef(0);

    useAnimationFrame(async () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!detectorRef.current || !video || !canvas || isProcessingRef.current) return;

        // Draw camera frame every frame for smoothness
        const ctx = canvas.getContext("2d", { alpha: false }); // Optimization
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

        // Run ML detection every 3 frames (~20fps detection on 60fps screen)
        // This reduces CPU/GPU load significantly while remaining responsive
        frameCountRef.current++;
        if (frameCountRef.current % 3 !== 0) return;

        isProcessingRef.current = true;
        try {
            const hands = await detectorRef.current.estimateHands(video, { flipHorizontal: false });

            // Clear just the areas where hands are drawn or draw on top if possible
            // For simplicity, we just draw over the previous frame
            drawHands(hands, ctx);

            if (hands.length > 0) {
                const currentGesture = detectGesture(hands[0]);
                // Only update React state if the gesture changed
                if (currentGesture !== lastGestureRef.current) {
                    setGesture(currentGesture);
                    lastGestureRef.current = currentGesture;
                }
            } else if (lastGestureRef.current !== GestureType.UNKNOWN) {
                setGesture(GestureType.UNKNOWN);
                lastGestureRef.current = GestureType.UNKNOWN;
            }
        } catch (err) {
            console.error("Detection error:", err);
        } finally {
            isProcessingRef.current = false;
        }
    }, isReady);

    return {
        videoRef,
        canvasRef,
        gesture,
        isReady,
        logs
    };
}
