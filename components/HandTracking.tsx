"use client";

import styles from "/styles/Home.module.css";
import { useEffect, useRef, useState } from "react";
import {
  createDetector,
  SupportedModels,
  HandDetector
} from "@tensorflow-models/hand-pose-detection";
import "@tensorflow/tfjs-backend-webgl";
import { drawHands } from "@/lib/utils";
import Link from "next/link";
import { useAnimationFrame } from "@/lib/hooks/useAnimationFrame";
import * as tfjsWasm from "@tensorflow/tfjs-backend-wasm";
import { detectGesture, Gesture } from "@/lib/gestures";

// Charger TensorFlow WASM
tfjsWasm.setWasmPaths("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm");

// Fonction pour configurer la vidéo
async function setupVideo(setLogs: (log: string) => void): Promise<HTMLVideoElement> {
  setLogs("🔄 Demande d'accès à la caméra...");
  const video = document.getElementById("video") as HTMLVideoElement;
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });

  setLogs("✅ Caméra activée !");
  video.srcObject = stream;
  await new Promise<void>((resolve) => {
    video.onloadedmetadata = () => resolve();
  });

  video.play();
  video.width = video.videoWidth;
  video.height = video.videoHeight;

  setLogs(`🎥 Vidéo prête (width: ${video.width}, height: ${video.height})`);
  return video;
}

// Fonction pour configurer le détecteur de main
async function setupDetector(setLogs: (log: string) => void): Promise<HandDetector> {
  setLogs("🔄 Initialisation du détecteur...");
  const model = SupportedModels.MediaPipeHands;
  const detector = await createDetector(model, {
    runtime: "mediapipe",
    maxHands: 2,
    solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/hands"
  });

  setLogs("✅ Détecteur prêt !");
  return detector;
}

// Fonction pour configurer le canvas
async function setupCanvas(video: HTMLVideoElement, setLogs: (log: string) => void): Promise<CanvasRenderingContext2D> {
  setLogs("🎨 Configuration du canvas...");
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

  canvas.width = video.width;
  canvas.height = video.height;

  setLogs("✅ Canvas prêt !");
  return ctx;
}

export default function HandPoseDetection() {
  const detectorRef = useRef<HandDetector | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [currentGesture, setCurrentGesture] = useState<Gesture>("Unknown");

  useEffect(() => {
    async function initialize() {
      try {
        setLogs(["🚀 Initialisation en cours..."]);
        const video = await setupVideo((msg) => setLogs((prev) => [...prev, msg]));
        videoRef.current = video;
        const context = await setupCanvas(video, (msg) => setLogs((prev) => [...prev, msg]));
        setCtx(context);
        detectorRef.current = await setupDetector((msg) => setLogs((prev) => [...prev, msg]));
      } catch (error) {
        setLogs((prev) => [...prev, `❌ Erreur: ${error instanceof Error ? error.message : "Une erreur inconnue s'est produite"}`]);
      }
    }
    initialize();
  }, []);

  useAnimationFrame(async () => {
    if (!detectorRef.current || !videoRef.current || !ctx) return;

    const hands = await detectorRef.current.estimateHands(videoRef.current, { flipHorizontal: false });
    ctx.clearRect(0, 0, videoRef.current.videoWidth, videoRef.current.videoHeight);
    ctx.drawImage(videoRef.current, 0, 0, videoRef.current.videoWidth, videoRef.current.videoHeight);
    drawHands(hands, ctx);

    if (hands.length > 0) {
      const gesture = detectGesture(hands[0]);
      if (gesture !== currentGesture) {
        setCurrentGesture(gesture);
        const icon = gesture === "Rock" ? "✊" : gesture === "Paper" ? "🖐️" : gesture === "Scissors" ? "✌️" : "❓";
        setLogs((prev) => [`Mode: ${gesture} ${icon}`, ...prev.slice(0, 5)]);
      }
    } else if (currentGesture !== "Unknown") {
      setCurrentGesture("Unknown");
    }
  }, !!(detectorRef.current && videoRef.current && ctx));

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h2 style={{ fontWeight: "normal" }}>
          <Link style={{ fontWeight: "bold" }} href={"/"}>
            Home
          </Link>{" "}
          / Hand Pose Detection 👋
        </h2>
        <code style={{ marginBottom: "1rem" }}>Work in progress...</code>

        {/* Affichage du geste actuel en gros */}
        <div style={{ fontSize: "5rem", marginBottom: "1rem" }}>
          {currentGesture === "Rock" ? "✊" : currentGesture === "Paper" ? "🖐️" : currentGesture === "Scissors" ? "✌️" : "❓"}
        </div>

        <canvas
          style={{
            transform: "scaleX(-1)",
            zIndex: 1,
            borderRadius: "1rem",
            boxShadow: "0 3px 10px rgb(0 0 0)",
            maxWidth: "85vw"
          }}
          id="canvas"
        ></canvas>
        <video
          style={{
            visibility: "hidden",
            transform: "scaleX(-1)",
            position: "absolute",
            top: 0,
            left: 0,
            width: 0,
            height: 0
          }}
          id="video"
          playsInline
        ></video>

        <pre
          style={{
            marginTop: "1rem",
            background: "#222",
            color: "#0f0",
            padding: "10px",
            borderRadius: "5px",
            maxWidth: "85vw",
            overflow: "auto",
            fontSize: "0.9rem"
          }}
        >
          {logs.join("\n")}
        </pre>
      </main>
    </div>
  );
}
