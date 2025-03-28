// 🔹 Fonction pour détecter si la main est ouverte
import { Hand ,Keypoint} from "@tensorflow-models/hand-pose-detection";

export function isHandOpen(hand: Hand): boolean {
  if (!hand.keypoints) return false;

  const fingers = ["index_finger_tip", "middle_finger_tip", "ring_finger_tip", "pinky_finger_tip"];
  const palmY = hand.keypoints[0].y; // Position du poignet

  return fingers.every((fingerName) => {
    const fingerTip = hand.keypoints.find((pt: Keypoint) => pt.name === fingerName);
    return fingerTip && fingerTip.y < palmY;
  });
}
