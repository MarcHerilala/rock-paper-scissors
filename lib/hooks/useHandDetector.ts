"use client";

import { useEffect, useRef, useState } from "react";
import {
    createDetector,
    SupportedModels,
    HandDetector
} from "@tensorflow-models/hand-pose-detection";
import "@tensorflow/tfjs-backend-webgl";
import { drawHands } from "@/lib/utils";
import { useAnimationFrame } from "@/lib/hooks/useAnimationFrame";
import * as tfjsWasm from "@tensorflow/tfjs-backend-wasm";
import { detectGesture, GestureType } from "@/lib/gestures";

const CONFIG = {
    TFJS_WASM_PATH: "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm",
    MEDIAPIPE_SOLUTION_PATH: "https://cdn.jsdelivr.net/npm/@mediapipe/hands",
};

tfjsWasm.setWasmPaths(CONFIG.TFJS_WASM_PATH);

export function useHandDetector() {
    const detectorRef = useRef<HandDetector | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const [isReady, setIsReady] = useState(false);
    const [gesture, setGesture] = useState<GestureType>(GestureType.UNKNOWN);
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => setLogs(prev => [msg, ...prev.slice(0, 2)]);

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

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 640, height: 480 }
                });

                if (!active) {
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }

                video.srcObject = stream;

                // Wait for video to be ready
                await new Promise<void>((resolve) => {
                    video.onloadeddata = () => {
                        video.play().then(resolve).catch(e => {
                            console.error("Play error:", e);
                            resolve(); // Resolve anyway to try continuing
                        });
                    };
                });

                if (!active) return;

                video.width = video.videoWidth || 640;
                video.height = video.videoHeight || 480;

                const canvas = canvasRef.current;
                if (canvas) {
                    canvas.width = video.width;
                    canvas.height = video.height;
                }

                addLog("ML: Loading detection model...");
                detectorRef.current = await createDetector(SupportedModels.MediaPipeHands, {
                    runtime: "mediapipe",
                    solutionPath: CONFIG.MEDIAPIPE_SOLUTION_PATH
                });

                if (!active) return;
                setIsReady(true);
                addLog("System: Ready.");
            } catch (err) {
                console.error("Init Error:", err);
                addLog("Error: Initialization failed.");
            }
        }

        init();
        return () => { active = false; };
    }, []);

    useAnimationFrame(async () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!detectorRef.current || !video || !canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const hands = await detectorRef.current.estimateHands(video, { flipHorizontal: false });

        ctx.clearRect(0, 0, video.videoWidth, video.videoHeight);
        ctx.save();
        ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        drawHands(hands, ctx);
        ctx.restore();

        const currentGesture = hands.length > 0 ? detectGesture(hands[0]) : GestureType.UNKNOWN;
        setGesture(currentGesture);
    }, isReady);

    return {
        videoRef,
        canvasRef,
        gesture,
        isReady,
        logs
    };
}
