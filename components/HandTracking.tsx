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

// Charger TensorFlow WASM
tfjsWasm.setWasmPaths("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm");

// Fonction pour configurer la vidéo
async function setupVideo(): Promise<HTMLVideoElement> {
  const video = document.getElementById("video") as HTMLVideoElement;
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });

  video.srcObject = stream;
  await new Promise<void>((resolve) => {
    video.onloadedmetadata = () => resolve();
  });

  video.play();
  video.width = video.videoWidth;
  video.height = video.videoHeight;

  return video;
}

// Fonction pour configurer le détecteur de main
async function setupDetector(): Promise<HandDetector> {
  const model = SupportedModels.MediaPipeHands;
  const detector = await createDetector(model, {
    runtime: "mediapipe",
    maxHands: 2,
    solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/hands"
  });

  return detector;
}

// Fonction pour configurer le canvas
async function setupCanvas(video: HTMLVideoElement): Promise<CanvasRenderingContext2D> {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

  canvas.width = video.width;
  canvas.height = video.height;

  return ctx;
}

export default function HandPoseDetection() {
  const detectorRef = useRef<HandDetector | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    async function initialize() {
      try {
        const video = await setupVideo();
        videoRef.current = video;
        const context = await setupCanvas(video);
        setCtx(context);
        detectorRef.current = await setupDetector();
      } catch (error) {
        console.error("Error initializing hand detection:", error);
      }
    }

    initialize();
  }, []);

  useAnimationFrame(async () => {
    if (!detectorRef.current || !videoRef.current || !ctx) return;

    const hands = await detectorRef.current.estimateHands(videoRef.current, {
      flipHorizontal: false
    });

    ctx.clearRect(0, 0, videoRef.current.videoWidth, videoRef.current.videoHeight);
    ctx.drawImage(videoRef.current, 0, 0, videoRef.current.videoWidth, videoRef.current.videoHeight);
    drawHands(hands, ctx);
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
            visibility: "visible",
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
      </main>
    </div>
  );
}
