"use client";

import { useEffect, useRef, useState, useMemo } from "react";
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
import { detectGesture, GestureType } from "@/lib/gestures";
import {
  Hand,
  Scissors,
  CircleDot,
  HelpCircle,
  RotateCcw,
  Play,
  Trophy,
  Frown,
  Minus
} from "lucide-react";

// Config & Constants
const GAME_CONFIG = {
  COUNTDOWN_START: 3,
  AI_DECISION_DELAY_MS: 500,
  LOGS_HISTORY_SIZE: 3,
  TFJS_WASM_PATH: "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm",
  MEDIAPIPE_SOLUTION_PATH: "https://cdn.jsdelivr.net/npm/@mediapipe/hands",
};

enum GameState {
  IDLE = "IDLE",
  COUNTDOWN = "COUNTDOWN",
  AI_CHOOSING = "AI_CHOOSING",
  RESULT = "RESULT",
}

enum GameResult {
  WIN = "WIN",
  LOSS = "LOSS",
  DRAW = "DRAW",
}

// Map TFJS Wasm
tfjsWasm.setWasmPaths(GAME_CONFIG.TFJS_WASM_PATH);

// Icon mapping component
const GestureIcon = ({ type, className = "w-12 h-12" }: { type: GestureType, className?: string }) => {
  switch (type) {
    case GestureType.ROCK:
      return <CircleDot className={className} />;
    case GestureType.PAPER:
      return <Hand className={className} />;
    case GestureType.SCISSORS:
      return <Scissors className={className} />;
    default:
      return <HelpCircle className={className} />;
  }
};

// Pure helpers
const getAISelection = (): GestureType => {
  const choices = [GestureType.ROCK, GestureType.PAPER, GestureType.SCISSORS];
  return choices[Math.floor(Math.random() * choices.length)];
};

const determineResult = (player: GestureType, ai: GestureType): GameResult => {
  if (player === ai) return GameResult.DRAW;
  const outcomes: Record<GestureType, GestureType> = {
    [GestureType.ROCK]: GestureType.SCISSORS,
    [GestureType.PAPER]: GestureType.ROCK,
    [GestureType.SCISSORS]: GestureType.PAPER,
    [GestureType.UNKNOWN]: GestureType.UNKNOWN,
  };
  return outcomes[player] === ai ? GameResult.WIN : GameResult.LOSS;
};

export default function RockPaperScissorsGame() {
  // Refs
  const detectorRef = useRef<HandDetector | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const lastGestureRef = useRef<GestureType>(GestureType.UNKNOWN);

  // States
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [currentGesture, setCurrentGesture] = useState<GestureType>(GestureType.UNKNOWN);
  const [aiChoice, setAiChoice] = useState<GestureType>(GestureType.UNKNOWN);
  const [scores, setScores] = useState({ player: 0, ai: 0 });
  const [countdown, setCountdown] = useState(GAME_CONFIG.COUNTDOWN_START);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // System status for logging
  const addLog = (msg: string) => setLogs(p => [msg, ...p.slice(0, GAME_CONFIG.LOGS_HISTORY_SIZE - 1)]);

  // ML Initialization
  useEffect(() => {
    let active = true;
    async function init() {
      try {
        addLog("🚀 Initialisation...");
        const video = document.getElementById("video") as HTMLVideoElement;
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (!active) return;

        video.srcObject = stream;
        await new Promise<void>(res => (video.onloadedmetadata = () => res()));
        video.play();
        video.width = video.videoWidth;
        video.height = video.videoHeight;
        videoRef.current = video;

        const canvas = document.getElementById("canvas") as HTMLCanvasElement;
        const context = canvas.getContext("2d") as CanvasRenderingContext2D;
        canvas.width = video.width;
        canvas.height = video.height;
        if (!active) return;
        setCtx(context);

        detectorRef.current = await createDetector(SupportedModels.MediaPipeHands, {
          runtime: "mediapipe",
          solutionPath: GAME_CONFIG.MEDIAPIPE_SOLUTION_PATH
        });

        addLog("✅ Système prêt !");
      } catch (err) {
        addLog(`❌ Erreur caméra/ML`);
      }
    }
    init();
    return () => { active = false; };
  }, []);

  // Frame processing
  useAnimationFrame(async () => {
    if (!detectorRef.current || !videoRef.current || !ctx) return;

    const hands = await detectorRef.current.estimateHands(videoRef.current, { flipHorizontal: false });
    ctx.clearRect(0, 0, videoRef.current.videoWidth, videoRef.current.videoHeight);

    ctx.save();
    ctx.drawImage(videoRef.current, 0, 0, videoRef.current.videoWidth, videoRef.current.videoHeight);
    drawHands(hands, ctx);
    ctx.restore();

    const gesture = hands.length > 0 ? detectGesture(hands[0]) : GestureType.UNKNOWN;
    setCurrentGesture(gesture);
    lastGestureRef.current = gesture;
  }, !!(detectorRef.current && videoRef.current && ctx));

  // Game Engine
  const startRound = () => {
    if (gameState !== GameState.IDLE && gameState !== GameState.RESULT) return;

    setGameState(GameState.COUNTDOWN);
    setCountdown(GAME_CONFIG.COUNTDOWN_START);
    setGameResult(null);
    setAiChoice(GestureType.UNKNOWN);

    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(interval);
          resolveRound();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const resolveRound = () => {
    setGameState(GameState.AI_CHOOSING);
    setTimeout(() => {
      const aiSelected = getAISelection();
      const playerSelected = lastGestureRef.current;
      const result = determineResult(playerSelected, aiSelected);

      setAiChoice(aiSelected);
      setGameResult(result);

      if (result === GameResult.WIN) setScores(s => ({ ...s, player: s.player + 1 }));
      if (result === GameResult.LOSS) setScores(s => ({ ...s, ai: s.ai + 1 }));

      setGameState(GameState.RESULT);
    }, GAME_CONFIG.AI_DECISION_DELAY_MS);
  };

  // UI mappings
  const resultColorClass = useMemo(() => {
    if (!gameResult) return "text-white";
    return {
      [GameResult.WIN]: "text-green-400",
      [GameResult.LOSS]: "text-red-500",
      [GameResult.DRAW]: "text-yellow-400",
    }[gameResult];
  }, [gameResult]);

  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-8 space-y-8 animate-in fade-in duration-1000">
      {/* Score Header */}
      <header className="grid grid-cols-2 gap-4 w-full max-w-xl">
        <ScoreCard label="Toi" score={scores.player} color="blue" />
        <ScoreCard label="AI" score={scores.ai} color="red" />
      </header>

      {/* Game Window */}
      <section className="relative group overflow-hidden rounded-[4rem] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.6)] bg-black/20">
        <canvas id="canvas" className="w-full max-w-2xl transform scale-x-[-1] transition-opacity duration-300" />
        <video id="video" className="hidden" />

        {/* CountDown Overlay */}
        {gameState === GameState.COUNTDOWN && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <span className="text-[15rem] font-black text-white italic drop-shadow-2xl animate-ping">{countdown}</span>
          </div>
        )}

        {/* Round Result Overlay */}
        {gameState === GameState.RESULT && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-xl p-8 animate-in zoom-in-95 duration-500">
            <div className="flex items-end space-x-12 mb-10">
              <ChoiceDisplay label="Toi" choice={currentGesture} />
              <div className="text-4xl font-black text-white/20 mb-8 self-center">VS</div>
              <ChoiceDisplay label="AI" choice={aiChoice} animate />
            </div>

            <div className={`flex items-center gap-4 text-7xl font-black mb-10 italic uppercase ${resultColorClass}`}>
              {gameResult === GameResult.WIN && <Trophy className="w-16 h-16" />}
              {gameResult === GameResult.LOSS && <Frown className="w-16 h-16" />}
              {gameResult === GameResult.DRAW && <Minus className="w-16 h-16" />}
              {gameResult === GameResult.WIN ? "Gagné !" :
                gameResult === GameResult.LOSS ? "Perdu..." : "Égalité"}
            </div>

            <PlayButton onClick={startRound} label="REJOUER" icon={<RotateCcw className="w-6 h-6" />} />
          </div>
        )}

        {/* Live Status Hint */}
        {gameState === GameState.IDLE && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-2xl border border-white/10 px-8 py-3 rounded-full flex items-center space-x-4 shadow-xl">
            <GestureIcon type={currentGesture} className="w-8 h-8 text-blue-400" />
            <span className="text-white font-bold tracking-wide">
              {currentGesture === GestureType.UNKNOWN ? "Prêt ?" : currentGesture}
            </span>
          </div>
        )}
      </section>

      {/* Main Action Call */}
      {gameState === GameState.IDLE && (
        <PlayButton onClick={startRound} label="Démarrer !" icon={<Play className="w-8 h-8" />} large />
      )}

      {/* System Monitor */}
      <footer className="w-full max-w-xl bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/5 space-y-3">
        <div className="flex items-center space-x-3">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"></div>
          <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em]">Game Intelligence Stream</p>
        </div>
        <div className="space-y-1">
          {logs.map((log, i) => (
            <p key={i} className="text-white/50 font-mono text-xs flex items-center gap-2">
              <span className="text-white/20">[{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
              {log}
            </p>
          ))}
        </div>
      </footer>
    </div>
  );
}

/* Sub-components for cleaner structure */

const ScoreCard = ({ label, score, color }: { label: string, score: number, color: "blue" | "red" }) => (
  <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[3rem] flex flex-col items-center shadow-inner transition-transform hover:scale-[1.02]">
    <span className="text-white/40 text-xs font-black uppercase tracking-widest mb-2">{label}</span>
    <span className={`text-6xl font-black ${color === "blue" ? "text-blue-400" : "text-red-500"}`}>{score}</span>
  </div>
);

const ChoiceDisplay = ({ label, choice, animate }: { label: string, choice: GestureType, animate?: boolean }) => (
  <div className="flex flex-col items-center group">
    <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mb-4">{label}</span>
    <div className={`transition-transform duration-500 ${animate ? 'animate-bounce' : 'group-hover:scale-110'}`}>
      <GestureIcon type={choice} className="w-32 h-32 text-white" />
    </div>
  </div>
);

const PlayButton = ({ onClick, label, icon, large }: { onClick: () => void, label: string, icon?: React.ReactNode, large?: boolean }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-4 relative overflow-hidden font-black tracking-widest uppercase italic transition-all transform active:scale-95 shadow-2xl
      ${large ? 'px-20 py-8 bg-blue-600 hover:bg-blue-500 text-3xl rounded-[2.5rem]' : 'px-14 py-4 bg-white text-black text-xl rounded-full hover:scale-110'}
    `}
  >
    {icon}
    {label}
    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
  </button>
);
