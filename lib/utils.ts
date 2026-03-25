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
    if (hands.length === 0) return;

    hands.sort((hand1, hand2) => (hand1.handedness < hand2.handedness ? 1 : -1));

    for (let i = 0; i < hands.length; i++) {
        ctx.fillStyle = hands[i].handedness === "Left" ? "black" : "blue";
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;

        for (let y = 0; y < hands[i].keypoints.length; y++) {
            const keypoint = hands[i].keypoints[y];
            ctx.beginPath();
            ctx.arc(keypoint.x, keypoint.y, 4, 0, 2 * Math.PI);
            ctx.fill();

            if (showNames && keypoint.name) {
                drawInvertedText(keypoint, ctx);
            }
        }

        for (const finger in FINGER_LOOKUP_INDICES) {
            const points = FINGER_LOOKUP_INDICES[finger as keyof typeof FINGER_LOOKUP_INDICES].map(idx => hands[i].keypoints[idx])
                .filter((point) => point !== undefined); // Évite les undefined
            drawPath(points, ctx);
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