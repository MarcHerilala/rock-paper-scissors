# Hand Tracker RPS Game

A simple Rock-Paper-Scissors game using real-time hand detection with MediaPipe and TensorFlow.js.

This project was built for fun.

## Features
- Real-time hand detection using the camera.
- Game logic vs AI with scoring and countdown.
- Modular architecture using custom hooks to separate detection logic from UI.

## Technical Stack
- Framework: Next.js 16 (App Router)
- ML Detection: @tensorflow-models/hand-pose-detection
- Styling: Tailwind CSS 4
- Icons: Lucide React

## Important Note: Camera Security
> [!IMPORTANT]
> Camera access (`navigator.mediaDevices.getUserMedia`) is restricted by modern browsers for security purposes.
>
> - **Local Development**: Access is allowed on `localhost` or via `https://`.
> - **Local Network**: Access will fail if you try to open the app via an IP address (e.g., `192.168.1.x`) over **HTTP**. For mobile testing or local network access, it's recommended to use a tool like **ngrok** to provide a secure HTTPS tunnel.
> - **Production**: The application must be served over **HTTPS** for the camera to work.

## Installation
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Create production build
npm run build
```

## Project Structure
- `components/HandTracking.tsx`: Main UI component.
- `lib/hooks/useHandDetector.ts`: Camera and ML model management.
- `lib/hooks/useRockPaperScissors.ts`: Game state and rules.
- `lib/gestures.ts`: Gesture detection logic.
