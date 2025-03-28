// 🔹 Fonction pour détecter si la main est ouverte
import { Hand ,Keypoint} from "@tensorflow-models/hand-pose-detection";

export function isHandOpen(hand: Hand): boolean {
  if (!hand.keypoints) return false;

  // Liste des doigts et leurs points clés
  const fingers = [
    { tip: "index_finger_tip", pip: "index_finger_pip" },
    { tip: "middle_finger_tip", pip: "middle_finger_pip" },
    { tip: "ring_finger_tip", pip: "ring_finger_pip" },
    { tip: "pinky_finger_tip", pip: "pinky_finger_pip" }
  ];

  let openFingers = 0;

  fingers.forEach(({ tip, pip }) => {
    const fingerTip = hand.keypoints.find((pt: Keypoint) => pt.name === tip);
    const fingerPip = hand.keypoints.find((pt: Keypoint) => pt.name === pip);

    if (fingerTip && fingerPip) {
      if (fingerTip.y < fingerPip.y) {
        openFingers++; // Doigt ouvert
      }
    }
  });

  // Si au moins 3 doigts sont ouverts, on considère que la main est ouverte
  return openFingers >= 3;
}

