import { Hand, Keypoint } from "@tensorflow-models/hand-pose-detection";

export enum GestureType {
    ROCK = "Rock",
    PAPER = "Paper",
    SCISSORS = "Scissors",
    UNKNOWN = "Unknown",
}

enum FingerName {
    THUMB = "thumb",
    INDEX = "index_finger",
    MIDDLE = "middle_finger",
    RING = "ring_finger",
    PINKY = "pinky_finger",
}

function getDistance(pt1: Keypoint, pt2: Keypoint): number {
    return Math.sqrt(Math.pow(pt1.x - pt2.x, 2) + Math.pow(pt1.y - pt2.y, 2));
}

export function detectGesture(hand: Hand): GestureType {
    if (!hand.keypoints || hand.keypoints.length === 0) return GestureType.UNKNOWN;

    const keypoints = hand.keypoints;
    // Create a map for O(1) lookup
    const kpMap: Record<string, Keypoint> = {};
    for (const kp of keypoints) {
        if (kp.name) kpMap[kp.name] = kp;
    }

    const wrist = kpMap["wrist"];
    if (!wrist) return GestureType.UNKNOWN;

    const isFingerOpen = (finger: string): boolean => {
        const mcp = kpMap[`${finger}_mcp`];
        const pip = kpMap[`${finger}_pip`];
        const tip = kpMap[`${finger}_tip`];
        if (!mcp || !pip || !tip) return false;

        // Use the base of the finger (MCP) as the origin for distance checks
        // An open finger has the tip significantly further from the base than the PIP joint
        const dxTip = tip.x - mcp.x;
        const dyTip = tip.y - mcp.y;
        const dzTip = (tip as any).z - (mcp as any).z || 0;

        const dxPip = pip.x - mcp.x;
        const dyPip = pip.y - mcp.y;
        const dzPip = (pip as any).z - (mcp as any).z || 0;

        const distSqTip = dxTip * dxTip + dyTip * dyTip + dzTip * dzTip;
        const distSqPip = dxPip * dxPip + dyPip * dyPip + dzPip * dzPip;

        // A finger is considered open if the tip is further than the PIP.
        // We use a small buffer (1.2 multiplier) to avoid false positives for folded fingers
        // when viewed from the front.
        return distSqTip > distSqPip * 1.2;
    };

    const indexOpen = isFingerOpen(FingerName.INDEX);
    const middleOpen = isFingerOpen(FingerName.MIDDLE);
    const ringOpen = isFingerOpen(FingerName.RING);
    const pinkyOpen = isFingerOpen(FingerName.PINKY);

    // Paper: All fingers open
    if (indexOpen && middleOpen && ringOpen && pinkyOpen) {
        return GestureType.PAPER;
    }

    // Scissors: Index and Middle open, Ring and Pinky closed
    if (indexOpen && middleOpen && !ringOpen && !pinkyOpen) {
        return GestureType.SCISSORS;
    }

    // Rock: All fingers closed
    if (!indexOpen && !middleOpen && !ringOpen && !pinkyOpen) {
        return GestureType.ROCK;
    }

    return GestureType.UNKNOWN;
}
