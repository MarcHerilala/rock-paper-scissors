
import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";

export function detectExpression(
    faces: faceLandmarksDetection.Face[], 
    setLogs: (msg: string) => void
): void {
    if (faces.length === 0) return;
    
    const keypoints: faceLandmarksDetection.Keypoint[] = faces[0].keypoints;

    // Points de la bouche
    const mouth: faceLandmarksDetection.Keypoint[] = keypoints.slice(61, 291);

    // Points des yeux
    const leftEye: faceLandmarksDetection.Keypoint[] = keypoints.slice(133, 144);
    const rightEye: faceLandmarksDetection.Keypoint[] = keypoints.slice(362, 374);

    // Points de référence pour la direction du regard
    const noseTip = keypoints[1]; // Pointe du nez
    const leftPupil = leftEye[4]; // Point approximatif de la pupille gauche
    const rightPupil = rightEye[4]; // Point approximatif de la pupille droite

    // Largeur du visage (distance entre les tempes)
    const faceWidth: number = Math.hypot(
        keypoints[234].x - keypoints[454].x,
        keypoints[234].y - keypoints[454].y
    );

    // Détection du sourire
    const mouthWidth: number = Math.hypot(mouth[6].x - mouth[0].x, mouth[6].y - mouth[0].y);
    const mouthHeight: number = Math.hypot(mouth[13].x - mouth[14].x, mouth[13].y - mouth[14].y);
    const smileRatio: number = mouthWidth / faceWidth;
    const mouthAspectRatio: number = mouthWidth / mouthHeight;

    const isSmiling: boolean = smileRatio > 0.9 && mouthAspectRatio > 3.0;

    // Détection du regard détourné
    const noseToLeftPupil = Math.abs(noseTip.x - leftPupil.x);
    const noseToRightPupil = Math.abs(noseTip.x - rightPupil.x);

    // Seuils pour considérer que la personne regarde ailleurs
    const lookAwayThreshold = faceWidth * 0.15; // Ajustable en fonction de la sensibilité désirée
    const isLookingAway: boolean = noseToLeftPupil > lookAwayThreshold || noseToRightPupil > lookAwayThreshold;

    // 🔥 Logs combinés
    if (!isLookingAway) {
        setLogs("👀 La personne semble regarder ailleurs pendant qu'elle parle !");
    } else if (isSmiling) {
        setLogs("😁 La personne sourit beaucoup !");
    } else {
        setLogs("😐 Pas de sourire et regard neutre.");
    }
}
