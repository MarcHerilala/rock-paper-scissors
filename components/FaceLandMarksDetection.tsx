import { useEffect, useRef, useState } from 'react';
import { useAnimationFrame } from '../lib/hooks/useAnimationFrame';
import '@tensorflow/tfjs-backend-webgl';
import * as tfjsWasm from '@tensorflow/tfjs-backend-wasm';
import { drawFaces } from '../lib/utils';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import * as faceMesh from '@mediapipe/face_mesh';
import '@tensorflow-models/face-detection';

tfjsWasm.setWasmPaths('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm');

// Définition du type du détecteur
type FaceDetector = faceLandmarksDetection.FaceLandmarksDetector;

// Fonction pour configurer le détecteur de visages
async function setupDetector(): Promise<FaceDetector> {
    const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
    const detector = await faceLandmarksDetection.createDetector(model, {
        runtime: 'mediapipe',
        solutionPath: `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@${faceMesh.VERSION}`,
        maxFaces: 2,
        refineLandmarks: true
    });

    return detector;
}

// Fonction pour configurer la vidéo
async function setupVideo(): Promise<HTMLVideoElement> {
    const video = document.getElementById('video') as HTMLVideoElement;
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

// Fonction pour configurer le canvas
async function setupCanvas(video: HTMLVideoElement): Promise<CanvasRenderingContext2D> {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

    canvas.width = video.width;
    canvas.height = video.height;

    return ctx;
}

export default function FaceLandmarksDetection() {
    const detectorRef = useRef<FaceDetector | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
    
    // Index des contours pour dessiner le visage
    const contours = faceLandmarksDetection.util.getKeypointIndexByContour(faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh);

    useEffect(() => {
        async function initialize() {
            try {
                const video = await setupVideo();
                videoRef.current = video;
                const context = await setupCanvas(video);
                setCtx(context);
                detectorRef.current = await setupDetector();
            } catch (error) {
                console.error('Error initializing face detection:', error);
            }
        }

        initialize();
    }, []);

    useAnimationFrame(async () => {
        if (!detectorRef.current || !videoRef.current || !ctx) return;

        const faces = await detectorRef.current.estimateFaces(videoRef.current);

        ctx.clearRect(0, 0, videoRef.current.videoWidth, videoRef.current.videoHeight);
        ctx.drawImage(videoRef.current, 0, 0, videoRef.current.videoWidth, videoRef.current.videoHeight);
        drawFaces(faces, ctx, contours);
    }, !!(detectorRef.current && videoRef.current && ctx));

    return (
        <>
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
        </>
    );
}
