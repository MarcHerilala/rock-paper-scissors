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
    if (!hand.keypoints) return GestureType.UNKNOWN;

    const keypoints = hand.keypoints;
    const getPt = (name: string) => keypoints.find((pt: Keypoint) => pt.name === name);

    const wrist = getPt("wrist");
    if (!wrist) return GestureType.UNKNOWN;

    const isFingerOpen = (finger: FingerName): boolean => {
        const tip = getPt(`${finger}_tip`);
        const pip = getPt(`${finger}_pip`);
        if (!tip || !pip) return false;

        // Distance-based check for robustness
        return getDistance(tip, wrist) > getDistance(pip, wrist);
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
