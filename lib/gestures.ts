import { Hand, Keypoint } from "@tensorflow-models/hand-pose-detection";

export type Gesture = "Rock" | "Paper" | "Scissors" | "Unknown";

export function detectGesture(hand: Hand): Gesture {
    if (!hand.keypoints) return "Unknown";

    const keypoints = hand.keypoints;

    // Helper function to get a keypoint by name
    const getPt = (name: string) => keypoints.find((pt: any) => pt.name === name);

    const thumbTip = getPt("thumb_tip");
    const indexTip = getPt("index_finger_tip");
    const indexPip = getPt("index_finger_pip");
    const middleTip = getPt("middle_finger_tip");
    const middlePip = getPt("middle_finger_pip");
    const ringTip = getPt("ring_finger_tip");
    const ringPip = getPt("ring_finger_pip");
    const pinkyTip = getPt("pinky_finger_tip");
    const pinkyPip = getPt("pinky_finger_pip");

    if (!indexTip || !indexPip || !middleTip || !middlePip || !ringTip || !ringPip || !pinkyTip || !pinkyPip) {
        return "Unknown";
    }

    const isIndexOpen = indexTip.y < indexPip.y;
    const isMiddleOpen = middleTip.y < middlePip.y;
    const isRingOpen = ringTip.y < ringPip.y;
    const isPinkyOpen = pinkyTip.y < pinkyPip.y;

    // Paper: All 4 main fingers open
    if (isIndexOpen && isMiddleOpen && isRingOpen && isPinkyOpen) {
        return "Paper";
    }

    // Scissors: Index and Middle open, Ring and Pinky closed
    if (isIndexOpen && isMiddleOpen && !isRingOpen && !isPinkyOpen) {
        return "Scissors";
    }

    // Rock: All 4 main fingers closed
    if (!isIndexOpen && !isMiddleOpen && !isRingOpen && !isPinkyOpen) {
        return "Rock";
    }

    return "Unknown";
}
