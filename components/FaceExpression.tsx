import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";

export function detectExpression(
    faces: faceLandmarksDetection.Face[], 
    setLogs: (msg: string) => void
): void {
    if (faces.length === 0) return;
    
    const keypoints: faceLandmarksDetection.Keypoint[] = faces[0].keypoints;

    // Points de la bouche
    const mouthLeft = keypoints[61]; // Coin gauche
    const mouthRight = keypoints[291]; // Coin droit
    const upperLip = keypoints[13]; // Centre lèvre sup
    const lowerLip = keypoints[14]; // Centre lèvre inf

    // Points des yeux
    const leftEyeInner = keypoints[133]; // Intérieur œil gauche
    const rightEyeInner = keypoints[362]; // Intérieur œil droit

    // Centre du visage (repère pour le regard)
    const noseTip = keypoints[1]; // Pointe du nez

    // Largeur du visage (distance entre les tempes)
    const faceWidth: number = Math.hypot(
        keypoints[234].x - keypoints[454].x,
        keypoints[234].y - keypoints[454].y
    );

    // 🔵 Détection du sourire
    const mouthWidth: number = Math.hypot(
        mouthRight.x - mouthLeft.x, 
        mouthRight.y - mouthLeft.y
    );

    const mouthHeight: number = Math.hypot(
        upperLip.x - lowerLip.x, 
        upperLip.y - lowerLip.y
    );

    const smileRatio: number = mouthWidth / faceWidth; // Largeur de la bouche par rapport au visage
    const mouthAspectRatio: number = mouthWidth / mouthHeight; // Largeur/Hauteur (bouche étirée ou pas)

    const isSmiling: boolean = smileRatio > 0.4 && mouthAspectRatio > 1.8; // Seuils corrigés

    // 🔵 Détection du regard détourné
    const eyeMidpointX = (leftEyeInner.x + rightEyeInner.x) / 2; // Centre des yeux
    const deviationX = Math.abs(noseTip.x - eyeMidpointX); // Distance nez - yeux

    const lookAwayThreshold = faceWidth * 0.1; // Ajusté à 10% de la largeur du visage
    const isLookingAway: boolean = deviationX > lookAwayThreshold; // Vrai si le regard s'écarte trop

    // 🔥 Logs améliorés
    if (isLookingAway) {
        setLogs("👀 La personne regarde ailleurs.");
    } else if (isSmiling) {
        setLogs("😁 La personne sourit !");
    } else {
        setLogs("😐 Pas de sourire, regard neutre.");
    }
}
