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
        const tip = kpMap[`${finger}_tip`];
        if (!mcp || !tip || !wrist) return false;

        // Simple and robust: A finger is open if the tip is significantly further 
        // from the wrist than the base of the finger (MCP).
        const dxTip = tip.x - wrist.x;
        const dyTip = tip.y - wrist.y;
        const dzTip = (tip as any).z - (wrist as any).z || 0;

        const dxMcp = mcp.x - wrist.x;
        const dyMcp = mcp.y - wrist.y;
        const dzMcp = (mcp as any).z - (wrist as any).z || 0;

        const distSqTip = dxTip * dxTip + dyTip * dyTip + dzTip * dzTip;
        const distSqMcp = dxMcp * dxMcp + dyMcp * dyMcp + dzMcp * dzMcp;

        // A finger is open if it extends beyond the palm
        return distSqTip > distSqMcp * 1.3;
    };

    const isThumbOpen = (): boolean => {
        const tip = kpMap["thumb_tip"];
        const ip = kpMap["thumb_ip"];
        const mcp = kpMap["thumb_mcp"];
        if (!tip || !ip || !mcp) return false;

        // Thumb is open if tip is further from the wrist than the IP joint
        const distTip = getDistance(tip, wrist);
        const distIp = getDistance(ip, wrist);
        return distTip > distIp * 1.1;
    };

    const indexOpen = isFingerOpen("index_finger");
    const middleOpen = isFingerOpen("middle_finger");
    const ringOpen = isFingerOpen("ring_finger");
    const pinkyOpen = isFingerOpen("pinky_finger");
    const thumbOpen = isThumbOpen();

    // Paper: All fingers open
    if (indexOpen && middleOpen && ringOpen && pinkyOpen) {
        return GestureType.PAPER;
    }

    // Scissors: Index and Middle open, Ring and Pinky closed
    if (indexOpen && middleOpen && !ringOpen && !pinkyOpen) {
        return GestureType.SCISSORS;
    }

    // Rock: All main fingers closed
    if (!indexOpen && !middleOpen && !ringOpen && !pinkyOpen) {
        return GestureType.ROCK;
    }

    return GestureType.UNKNOWN;
}
