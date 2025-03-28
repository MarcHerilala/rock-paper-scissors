import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";

export function detectExpression(
    faces: faceLandmarksDetection.Face[], 
    setLogs: (msg: string) => void
): void {
    if (faces.length === 0) return;
    
    const keypoints: faceLandmarksDetection.Keypoint[] = faces[0].keypoints;

    // Points de la bouche
    const mouth: faceLandmarksDetection.Keypoint[] = keypoints.slice(61, 291);

    // Largeur du visage (distance entre les tempes)
    const faceWidth: number = Math.hypot(
        keypoints[234].x - keypoints[454].x,
        keypoints[234].y - keypoints[454].y
    );

    // Largeur de la bouche (distance entre les coins)
    const mouthWidth: number = Math.hypot(
        mouth[6].x - mouth[0].x, 
        mouth[6].y - mouth[0].y
    );

    // Hauteur de la bouche (distance lèvres supérieures - inférieures)
    const mouthHeight: number = Math.hypot(
        mouth[13].x - mouth[14].x, 
        mouth[13].y - mouth[14].y
    );

    // Détection du sourire basée sur le ratio largeur / hauteur de la bouche
    const smileRatio: number = mouthWidth / faceWidth;
    const mouthAspectRatio: number = mouthWidth / mouthHeight; // Plus grand si la bouche est étirée horizontalement

    // Seuils ajustés
    const isSmiling: boolean = smileRatio > 0.4 && mouthAspectRatio > 2.0;

    // 🔥 Ajout des logs d'expression
    if (isSmiling) setLogs("😁 La personne sourit beaucoup !");
    else setLogs("😐 Pas de sourire.");
}
