# Synthetica Tunez

An AI-powered music creation and social sharing platform built with React Native and Expo.

## Prerequisites

- Node.js installed
- [Expo Go](https://expo.dev/client) app installed on your iOS or Android device (recommended for testing)
- OR an iOS Simulator (Mac only) / Android Emulator

## Getting Started

1.  **Install dependencies** (if you haven't already):
    ```bash
    npm install
    ```

2.  **Start the development server**:
    ```bash
    npx expo start
    ```

3.  **Run the app**:
    - **Physical Device**: Scan the QR code shown in the terminal with your phone's camera (iOS) or the Expo Go app (Android).
    - **iOS Simulator**: Press `i` in the terminal.
    - **Android Emulator**: Press `a` in the terminal.

## Project Structure

- `src/components`: Reusable UI components (TrackTile, FeedCard, etc.)
- `src/screens`: Application screens (Auth, Library, Create Flow, etc.)
- `src/navigation`: Navigation configuration (Stack & Tab navigators)
- `src/theme`: Centralized theme configuration (Colors, Spacing, Typography)

## Design Philosophy

This project follows a "Ruthless Minimalism" design philosophy:
- Monochromatic color palette (Black/White/Gray)
- Content-first architecture
- Generous whitespace
