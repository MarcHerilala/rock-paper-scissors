const FINGER_LOOKUP_INDICES = {
    thumb: [0, 1, 2, 3, 4],
    indexFinger: [0, 5, 6, 7, 8],
    middleFinger: [0, 9, 10, 11, 12],
    ringFinger: [0, 13, 14, 15, 16],
    pinky: [0, 17, 18, 19, 20],
};

type Keypoint = {
    x: number;
    y: number;
    name?: string; // Pour le nom des points clés (ex: index, thumb, etc.)
};

type Hand = {
    handedness: "Left" | "Right";
    keypoints: Keypoint[];
};

export const drawHands = (hands: Hand[], ctx: CanvasRenderingContext2D, showNames = false) => {
    const numHands = hands.length;
    if (numHands === 0) return;

    // Only sort if multiple hands are present
    if (numHands > 1) {
        hands.sort((hand1, hand2) => (hand1.handedness < hand2.handedness ? 1 : -1));
    }

    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;

    for (let i = 0; i < numHands; i++) {
        const hand = hands[i];
        ctx.fillStyle = hand.handedness === "Left" ? "black" : "blue";

        // Draw all keypoints in one go for better performance
        for (let y = 0; y < hand.keypoints.length; y++) {
            const keypoint = hand.keypoints[y];
            ctx.beginPath();
            ctx.arc(keypoint.x, keypoint.y, 4, 0, 2 * Math.PI);
            ctx.fill();

            if (showNames && keypoint.name) {
                drawInvertedText(keypoint, ctx);
            }
        }

        // Draw finger paths
        for (const finger in FINGER_LOOKUP_INDICES) {
            const indices = FINGER_LOOKUP_INDICES[finger as keyof typeof FINGER_LOOKUP_INDICES];
            const region = new Path2D();
            const startPt = hand.keypoints[indices[0]];
            if (!startPt) continue;

            region.moveTo(startPt.x, startPt.y);
            for (let j = 1; j < indices.length; j++) {
                const pt = hand.keypoints[indices[j]];
                if (pt) region.lineTo(pt.x, pt.y);
            }
            ctx.stroke(region);
        }
    }
};

const drawInvertedText = (keypoint: Keypoint, ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.translate(keypoint.x - 10, keypoint.y);
    ctx.rotate(-Math.PI / 1);
    ctx.scale(1, -1);
    ctx.fillText(keypoint.name || "", 0, 0);
    ctx.restore();
};

const drawPath = (points: Keypoint[], ctx: CanvasRenderingContext2D, closePath = false) => {
    if (points.length === 0) return;

    const region = new Path2D();
    region.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
        const point = points[i];
        region.lineTo(point.x, point.y);
    }

    if (closePath) {
        region.closePath();
    }

    ctx.stroke(region);
};