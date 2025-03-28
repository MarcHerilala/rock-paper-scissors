import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";

export function detectExpression(
    faces: faceLandmarksDetection.Face[], 
    setLogs: (msg: string) => void
): void {
    if (faces.length === 0) return;
    
    const keypoints: faceLandmarksDetection.Keypoint[] = faces[0].keypoints;

    // Points de la bouche
    const mouth: faceLandmarksDetection.Keypoint[] = keypoints.slice(61, 291);
    const leftEyebrow: faceLandmarksDetection.Keypoint[] = keypoints.slice(65, 105);
    const rightEyebrow: faceLandmarksDetection.Keypoint[] = keypoints.slice(295, 335);

    // Calcul du sourire : distance entre les coins de la bouche
    const mouthWidth: number = Math.hypot(
        mouth[6].x - mouth[0].x, 
        mouth[6].y - mouth[0].y
    );
    const faceWidth: number = Math.hypot(
        keypoints[234].x - keypoints[454].x,
        keypoints[234].y - keypoints[454].y
    );

    // Détection du sourire
    const smileRatio: number = mouthWidth / faceWidth;
    const isSmiling: boolean = smileRatio > 0.35; // Seuil empirique

    // Détection de la bouche ouverte : distance lèvres supérieures - inférieures
    const mouthOpen: boolean = Math.hypot(
        mouth[13].x - mouth[14].x, 
        mouth[13].y - mouth[14].y
    ) / faceWidth > 0.07;

    // Détection des sourcils froncés (distance réduite)
    const eyebrowDistance: number = Math.hypot(
        leftEyebrow[0].x - rightEyebrow[0].x, 
        leftEyebrow[0].y - rightEyebrow[0].y
    );
    const isFrowning: boolean = eyebrowDistance / faceWidth < 0.2; // Seuil empirique

    // 🔥 Ajout des logs d'expression
    if (isSmiling) setLogs("😁 La personne sourit beaucoup !");
    else setLogs("😐 Pas de sourire.");

    if (mouthOpen) setLogs("😲 La personne a la bouche ouverte.");

    if (isFrowning) setLogs("😠 La personne fronce les sourcils.");
}
