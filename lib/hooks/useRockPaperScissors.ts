"use client";

import { useState, useCallback, useRef } from "react";
import { GestureType } from "@/lib/gestures";

export enum GameState {
    IDLE = "IDLE",
    COUNTDOWN = "COUNTDOWN",
    AI_CHOOSING = "AI_CHOOSING",
    RESULT = "RESULT",
}

export enum GameResult {
    WIN = "WIN",
    LOSS = "LOSS",
    DRAW = "DRAW",
}

const CONFIG = {
    COUNTDOWN_START: 3,
    AI_DECISION_DELAY_MS: 500,
};

const getAISelection = (): GestureType => {
    const choices = [GestureType.ROCK, GestureType.PAPER, GestureType.SCISSORS];
    return choices[Math.floor(Math.random() * choices.length)];
};

const determineResult = (player: GestureType, ai: GestureType): GameResult => {
    if (player === ai) return GameResult.DRAW;
    const beats: Record<GestureType, GestureType> = {
        [GestureType.ROCK]: GestureType.SCISSORS,
        [GestureType.PAPER]: GestureType.ROCK,
        [GestureType.SCISSORS]: GestureType.PAPER,
        [GestureType.UNKNOWN]: GestureType.UNKNOWN,
    };
    return beats[player] === ai ? GameResult.WIN : GameResult.LOSS;
};

export function useRockPaperScissors() {
    const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
    const [aiChoice, setAiChoice] = useState<GestureType>(GestureType.UNKNOWN);
    const [scores, setScores] = useState({ player: 0, ai: 0 });
    const [countdown, setCountdown] = useState(CONFIG.COUNTDOWN_START);
    const [gameResult, setGameResult] = useState<GameResult | null>(null);
    const [lastPlayerChoice, setLastPlayerChoice] = useState<GestureType>(GestureType.UNKNOWN);

    const startRound = useCallback((currentGesture: GestureType) => {
        if (gameState !== GameState.IDLE && gameState !== GameState.RESULT) return;

        setGameState(GameState.COUNTDOWN);
        setCountdown(CONFIG.COUNTDOWN_START);
        setGameResult(null);
        setAiChoice(GestureType.UNKNOWN);

        const interval = setInterval(() => {
            setCountdown((c) => {
                if (c <= 1) {
                    clearInterval(interval);
                    resolveRound(currentGesture);
                    return 0;
                }
                return c - 1;
            });
        }, 1000);
    }, [gameState]);

    const resolveRound = (playerGesture: GestureType) => {
        setGameState(GameState.AI_CHOOSING);

        // We use a small timeout to simulate AI "thinking" and let the user see the countdown end
        setTimeout(() => {
            const aiSelected = getAISelection();
            const result = determineResult(playerGesture, aiSelected);

            setAiChoice(aiSelected);
            setLastPlayerChoice(playerGesture);
            setGameResult(result);

            if (result === GameResult.WIN) setScores(s => ({ ...s, player: s.player + 1 }));
            if (result === GameResult.LOSS) setScores(s => ({ ...s, ai: s.ai + 1 }));

            setGameState(GameState.RESULT);
        }, CONFIG.AI_DECISION_DELAY_MS);
    };

    return {
        gameState,
        aiChoice,
        scores,
        countdown,
        gameResult,
        lastPlayerChoice,
        startRound
    };
}
