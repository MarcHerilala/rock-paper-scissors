"use client";

import React, { useMemo } from "react";
import { GestureType } from "@/lib/gestures";
import { useHandDetector } from "@/lib/hooks/useHandDetector";
import { useRockPaperScissors, GameState, GameResult } from "@/lib/hooks/useRockPaperScissors";
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

// Presentation Components
const GestureIcon = ({ type, className = "w-12 h-12" }: { type: GestureType, className?: string }) => {
  switch (type) {
    case GestureType.ROCK: return <CircleDot className={className} />;
    case GestureType.PAPER: return <Hand className={className} />;
    case GestureType.SCISSORS: return <Scissors className={className} />;
    default: return <HelpCircle className={className} />;
  }
};

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

// Main Component
export default function RockPaperScissorsGame() {
  const { videoRef, canvasRef, gesture: currentGesture, isReady, logs } = useHandDetector();
  const { gameState, aiChoice, scores, countdown, gameResult, lastPlayerChoice, startRound } = useRockPaperScissors();

  const handleStart = () => startRound(currentGesture);

  const resultMeta = useMemo(() => {
    if (!gameResult) return { color: "text-white", label: "", Icon: Minus };
    switch (gameResult) {
      case GameResult.WIN: return { color: "text-green-400", label: "Gagné !", Icon: Trophy };
      case GameResult.LOSS: return { color: "text-red-500", label: "Perdu...", Icon: Frown };
      case GameResult.DRAW: return { color: "text-yellow-400", label: "Égalité", Icon: Minus };
    }
  }, [gameResult]);

  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-8 space-y-8 animate-in fade-in duration-1000">
      <header className="grid grid-cols-2 gap-4 w-full max-w-xl">
        <ScoreCard label="Toi" score={scores.player} color="blue" />
        <ScoreCard label="AI" score={scores.ai} color="red" />
      </header>

      <section className="relative group overflow-hidden rounded-[4rem] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.6)] bg-black/20">
        <canvas ref={canvasRef} id="canvas" className="w-full max-w-2xl transform scale-x-[-1] transition-opacity duration-300" />
        <video ref={videoRef} id="video" className="hidden" />

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
              <ChoiceDisplay label="Toi" choice={lastPlayerChoice} />
              <div className="text-4xl font-black text-white/20 mb-8 self-center">VS</div>
              <ChoiceDisplay label="AI" choice={aiChoice} animate />
            </div>

            <div className={`flex items-center gap-4 text-7xl font-black mb-10 italic uppercase ${resultMeta.color}`}>
              <resultMeta.Icon className="w-16 h-16" />
              {resultMeta.label}
            </div>

            <PlayButton onClick={handleStart} label="REJOUER" icon={<RotateCcw className="w-6 h-6" />} />
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

      {gameState === GameState.IDLE && (
        <div className="flex flex-col items-center gap-4">
          <PlayButton
            onClick={handleStart}
            label={isReady ? "Démarrer !" : logs[0]?.includes("❌") ? "Échec - Réessayer" : "Chargement..."}
            icon={isReady ? <Play className="w-8 h-8" /> : logs[0]?.includes("❌") ? <RotateCcw className="w-8 h-8" /> : null}
            large
          />
          {!isReady && !logs[0]?.includes("❌") && (
            <p className="text-white/20 text-xs animate-pulse">Assurez-vous d'autoriser la caméra</p>
          )}
        </div>
      )}

      <footer className="w-full max-w-xl bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/5 space-y-3 text-white/50 font-mono text-xs">
        <div className="flex items-center space-x-3 mb-1">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"></div>
          <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em]">Game Intelligence Stream</p>
        </div>
        {logs.map((log, i) => (
          <p key={i} className="flex items-center gap-2">
            <span className="text-white/20">[{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
            {log}
          </p>
        ))}
      </footer>
    </div>
  );
}
