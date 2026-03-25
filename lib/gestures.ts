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

        // Hand direction vector (Wrist to MCP)
        const hx = mcp.x - wrist.x;
        const hy = mcp.y - wrist.y;
        const hz = (mcp as any).z - (wrist as any).z || 0;

        // Finger direction vector (MCP to Tip)
        const fx = tip.x - mcp.x;
        const fy = tip.y - mcp.y;
        const fz = (tip as any).z - (mcp as any).z || 0;

        // Dot product to check if finger is pointing in the same direction as the hand
        const dotProduct = hx * fx + hy * fy + hz * fz;

        // Normalize by MCP-Wrist length squared to get a relative scale
        const hMagSq = hx * hx + hy * hy + hz * hz;

        // A value > 0.05 means the finger is extended away from the palm
        // We use a lower threshold to be more permissive for various hand angles
        return dotProduct > hMagSq * 0.05;
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
