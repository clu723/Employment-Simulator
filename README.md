# Employment Simulator

Do you want to feel like you're employed in this job market? Introducing Employment Simulator!

## 🚀 Key Features

- **AI Manager**: Context aware LLM "manager" that assigns tasks using Qwen 2.5:3B that I host locally.
- **Task Management**: Interactive to-do list with difficulty-based scoring (random for now).
- **Real-time Scoring**: Track your productivity and earn points by completing work.
- **Authentication**: Secure user login using Firebase Authentication (Google Sign-In).
- **Persistent Progress**: Scores and user data are stored and synced with Firestore.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS (AI generated)
- **Backend & DB**: Firebase (Auth & Firestore)
- **AI Integration**: Ollama + Tailscale

## 📋 Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- A Firebase Project (for Auth and Firestore)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd EmploymentSimulator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add your Firebase credentials (use `.env.example` as a template):
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

### Running Locally

To start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

### Building for Production

To create a production build:
```bash
npm run build
```
The build output will be in the `dist` folder.
