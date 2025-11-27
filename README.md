# AI Interview Assistant

A real-time AI-powered meeting assistant that listens to interview questions and provides instant, contextual answers using voice recognition and Claude AI.

## Features

- 🎤 Real-time speech-to-text transcription
- 🤖 AI-powered answers using Claude Haiku
- 🎯 Two modes: Generic (cost-effective) & Personalized (with your resume)
- 💬 Conversation memory (tracks last 5 Q&A pairs)
- 📋 Copy answers to clipboard
- 🪟 Floating overlay window
- 📊 Question/answer history

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up API Key

Create a `.env` file in the root directory:

```
ANTHROPIC_API_KEY=your_api_key_here
```

Get your API key from [console.anthropic.com](https://console.anthropic.com)

### 3. Run Development Server

```bash
npm run dev
```

### 4. Build for Production

```bash
npm run build
```

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Add environment variable: `ANTHROPIC_API_KEY`
4. Deploy!

### Deploy to Netlify

1. Push your code to GitHub
2. Import project on [netlify.com](https://netlify.com)
3. Add environment variable: `ANTHROPIC_API_KEY`
4. Set build command: `npm run build`
5. Set publish directory: `dist`
6. Deploy!

## Usage

1. **Click "Start Listening"** to activate voice recognition
2. **Choose your mode:**
   - **Generic Mode**: Fast, cost-effective answers
   - **Personalized Mode**: Answers based on your resume/experience
3. **Speak naturally** - the assistant detects questions automatically
4. **Get instant answers** in the floating window
5. **Copy answers** to use in your interview

## Browser Compatibility

- ✅ Chrome/Edge (Recommended)
- ❌ Firefox/Safari (Speech recognition not supported)

## Important Notes

- Requires microphone access
- Uses Claude Haiku 4.5 model (cost-effective)
- Only you can see the assistant - interviewers cannot
- Use responsibly and ethically

## Tech Stack

- React 19
- Vite
- Tailwind CSS
- Claude AI (Haiku 4.5)
- Web Speech API

## License

MIT
