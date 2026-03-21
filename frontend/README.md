# Medical AI Chatbot 🏥🤖

A personalized medical AI assistant built with React and Ollama.

## prerequisites

1.  **Node.js**: Ensure Node.js is installed.
2.  **Ollama**: Ensure Ollama is installed and running locally.
    *   Pull the model: `ollama pull llama3.1:8b` (Matches local config)
    *   Start the server: `ollama serve`

## How to Start 🚀

1.  Open your terminal.
2.  Navigate to the `frontend` directory:
    ```bash
    cd d:\ridham\DDU\Projects\MedicalAI_Chatbot\frontend
    ```
3.  Install dependencies (first time only):
    ```bash
    npm install
    ```
4.  Start the application:
    ```bash
    npm start
    ```
5.  The app will open automatically at [http://localhost:3000](http://localhost:3000).

## How to Stop 🛑

### Method 1: Keyboard Shortcut (Best)
1.  Click inside the terminal window where the server is running.
2.  Press **`Ctrl + C`**.
3.  If prompted "Terminate batch job (Y/N)?", type **`Y`** and hit Enter.

### Method 2: Close Terminal
Simply close the terminal window or command prompt.

### Method 3: Force Kill (If stuck)
If the port remains in use, run this command in a new terminal:
```bash
taskkill /F /IM node.exe /T
```

## Features
- **Personalized Health Profile**: Tailored advice based on age, gender, and metrics.
- **Local AI Privacy**: All processing happens locally via Ollama.
- **Voice Interface**: (Currently disabled by request, TTS available).
- **Secure Auth**: LocalStorage-based authentication with case-insensitive login.
