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
        const tip = kpMap[`${finger}_tip`];
        const pip = kpMap[`${finger}_pip`];
        if (!tip || !pip) return false;

        // Distance-based check for robustness
        // tip to wrist distance > pip to wrist distance
        const dxTip = tip.x - wrist.x;
        const dyTip = tip.y - wrist.y;
        const dxPip = pip.x - wrist.x;
        const dyPip = pip.y - wrist.y;

        return (dxTip * dxTip + dyTip * dyTip) > (dxPip * dxPip + dyPip * dyPip);
    };

    const indexOpen = isFingerOpen("index_finger");
    const middleOpen = isFingerOpen("middle_finger");
    const ringOpen = isFingerOpen("ring_finger");
    const pinkyOpen = isFingerOpen("pinky_finger");

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
