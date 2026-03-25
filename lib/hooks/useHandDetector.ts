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
            try {
                addLog("🔄 Initialisation caméra...");
                const video = videoRef.current;
                if (!video) return;

                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (!active) return;

                video.srcObject = stream;
                await new Promise<void>(res => (video.onloadedmetadata = () => res()));
                video.play();
                video.width = video.videoWidth;
                video.height = video.videoHeight;

                const canvas = canvasRef.current;
                if (canvas) {
                    canvas.width = video.width;
                    canvas.height = video.height;
                }

                addLog("🔄 Chargement du modèle...");
                detectorRef.current = await createDetector(SupportedModels.MediaPipeHands, {
                    runtime: "mediapipe",
                    solutionPath: CONFIG.MEDIAPIPE_SOLUTION_PATH
                });

                if (!active) return;
                setIsReady(true);
                addLog("✅ Système prêt !");
            } catch (err) {
                addLog("❌ Erreur Camera/ML");
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
