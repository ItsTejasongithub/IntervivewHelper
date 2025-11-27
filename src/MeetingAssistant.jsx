import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Copy, Trash2, MessageSquare, Settings } from 'lucide-react';

export default function MeetingAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState([]);
  const [conversationContext, setConversationContext] = useState([]);
  const [personalContext, setPersonalContext] = useState(''); // Personal info learned from docs/URLs
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [autoAnswer, setAutoAnswer] = useState(true);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [isTraining, setIsTraining] = useState(false);
  const [usePersonalizedMode, setUsePersonalizedMode] = useState(null); // null = not chosen yet
  const [showModeSelection, setShowModeSelection] = useState(true);
  const [opacity, setOpacity] = useState(95); // Transparency: 95% = slightly transparent
  const [popupAnswers, setPopupAnswers] = useState(true); // Show answers in popup window

  const recognitionRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const answerWindowRef = useRef(null);

  // Load profile from localStorage and JSON file on mount
  useEffect(() => {
    // Load from localStorage (old method - for backward compatibility)
    const savedProfile = localStorage.getItem('interviewAssistantProfile');
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile);
        setResumeText(profile.resumeText || '');
        setGithubUrl(profile.githubUrl || '');
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    }

    // Load from JSON file (new structured method)
    fetch('/personal-info.json')
      .then(res => res.json())
      .then(data => {
        // Store structured profile data
        setPersonalContext(JSON.stringify(data));
      })
      .catch(() => {
        console.log('No personal-info.json found, using manual input');
      });
  }, []);

  useEffect(() => {
    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window) {
      const recognition = new webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        // Process ALL results from the beginning to get the complete transcript
        for (let i = 0; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        // Always set the complete transcript (final + interim), not append
        const completeTranscript = finalTranscript + interimTranscript;
        setTranscript(completeTranscript);

        // Only trigger auto-answer when we have a final result ending with '?'
        if (finalTranscript && finalTranscript.trim().endsWith('?')) {
          if (autoAnswer) {
            handleGetAnswer(completeTranscript);
          }
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please enable microphone permissions.');
        }
      };

      recognitionRef.current = recognition;
    } else {
      alert('Speech recognition not supported in this browser. Please use Chrome.');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [autoAnswer]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setAiResponse('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Clean and deduplicate speech recognition artifacts - Smart token optimization
  const cleanQuestion = (text) => {
    if (!text) return '';

    // Remove extra whitespace
    text = text.trim().replace(/\s+/g, ' ');

    // Remove common filler phrases ONLY at the beginning or as standalone
    const leadingFillers = /^(so|okay|alright|well|um|uh|right|yeah|yes|sure|fine)\s+/gi;
    text = text.replace(leadingFillers, '').trim();

    // Remove standalone filler words that appear between words
    // But ONLY when they're not part of a valid question structure
    const standaloneFillers = /\s+(um|uh|like|i mean|kind of|sort of|basically|actually|literally)\s+/gi;
    text = text.replace(standaloneFillers, ' ').replace(/\s+/g, ' ').trim();

    // Remove common question prefixes that don't add value
    const questionPrefixes = [
      /^(so\s+)?(tell me|can you tell me|let me know|i want to know|i need to know|explain to me)\s+/i,
      /^(are you ready|ready|okay so|so then|and then|now)\s+/i
    ];

    questionPrefixes.forEach(prefix => {
      text = text.replace(prefix, '');
    });

    // Remove trailing filler questions like "are you there", "right", "okay"
    text = text.replace(/\s+(are you there|you there|right|okay)\s*$/gi, '').trim();

    // Extract the core question by identifying question patterns
    // Priority order: stronger question words first
    const primaryQuestionWords = ['how', 'what', 'why', 'when', 'where', 'who'];
    const secondaryQuestionWords = ['can', 'could', 'would', 'will', 'should', 'does', 'do', 'is', 'are'];

    // Look for the main question word in the text
    let mainQuestion = text;
    const lowerText = text.toLowerCase();

    // Find the position of the first primary question word
    let questionPos = -1;

    // First, look for primary question words (how, what, why, etc.)
    for (const word of primaryQuestionWords) {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      const match = lowerText.match(regex);
      if (match && (questionPos === -1 || match.index < questionPos)) {
        questionPos = match.index;
      }
    }

    // If no primary question word found, look for secondary ones
    if (questionPos === -1) {
      for (const word of secondaryQuestionWords) {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        const match = lowerText.match(regex);
        if (match) {
          questionPos = match.index;
          break;
        }
      }
    }

    // Extract from the question word position
    // But include up to 5 words before if they seem like topic context (capitalized or technical terms)
    if (questionPos >= 0) {
      const beforeQuestion = text.substring(0, questionPos).trim();
      const wordsBeforeQuestion = beforeQuestion.split(' ');

      // Check if words before the question are likely important context (capitalized, technical terms)
      let contextToKeep = [];
      const maxContextWords = 5;
      const recentWords = wordsBeforeQuestion.slice(-maxContextWords);

      for (const word of recentWords) {
        // Keep capitalized words (proper nouns, brands) or technical-looking words
        if (word.length > 0 && (word[0] === word[0].toUpperCase() || word.match(/[A-Z][a-z]+|[0-9]/))) {
          contextToKeep.push(word);
        }
      }

      // Combine context + question
      if (contextToKeep.length > 0) {
        mainQuestion = contextToKeep.join(' ') + ' ' + text.substring(questionPos);
      } else {
        mainQuestion = text.substring(questionPos);
      }
    }

    // Remove duplicate consecutive words
    const words = mainQuestion.split(' ');
    const deduped = [];
    for (let i = 0; i < words.length; i++) {
      if (i === 0 || words[i].toLowerCase() !== words[i-1].toLowerCase()) {
        deduped.push(words[i]);
      }
    }

    // Remove grammatical conflicts like "is doesn't", "is don't", "are doesn't"
    let result = deduped.join(' ');
    result = result.replace(/\b(is|are|was|were)\s+(doesn't|don't|didn't|won't|can't)\b/gi, "$2");
    result = result.replace(/\b(is|are)\s+(is|are)\b/gi, "$1");
    result = result.trim();

    // Remove incomplete trailing words (less than 3 chars that aren't common words)
    const commonShort = ['is', 'it', 'in', 'on', 'at', 'to', 'a', 'an', 'or', 'if', 'of', 'we', 'he', 'my', 'by'];
    const finalWords = result.split(' ');

    // Check if last word is incomplete (partial word)
    if (finalWords.length > 0) {
      const lastWord = finalWords[finalWords.length - 1].toLowerCase();
      if (lastWord.length < 3 && !commonShort.includes(lastWord) && !lastWord.match(/^[0-9]+$/)) {
        finalWords.pop();
      }
    }

    return finalWords.join(' ').trim();
  };

  // Smart context selection - only send relevant parts based on question
  const getRelevantContext = (question) => {
    if (!personalContext) return null;

    try {
      const profile = JSON.parse(personalContext);
      const lowerQuestion = question.toLowerCase();
      let contextParts = [];

      // IMPROVED: Detect if question is asking about YOU/YOUR experience vs general knowledge
      const personalIndicators = ['your', 'you', 'have you', 'did you', 'can you', 'tell me about your',
                                   'what have you', 'describe your', 'explain your', 'walk me through your'];
      const isPersonalQuestion = personalIndicators.some(indicator => lowerQuestion.includes(indicator));

      // IMPROVED: Pure theoretical questions should NOT use personal context
      const theoreticalIndicators = ['what is', 'define', 'explain what', 'how does', 'what are'];
      const isTheoreticalQuestion = theoreticalIndicators.some(indicator => lowerQuestion.includes(indicator)) && !isPersonalQuestion;

      // SMART FILTER: If it's a pure theoretical question, return null (no personal context needed)
      if (isTheoreticalQuestion && !usePersonalizedMode) {
        console.log('🧠 Smart filter: Theoretical question detected, using generic knowledge only');
        return null;
      }

      // Always include basic info for "tell me about yourself" or "introduce yourself"
      if (lowerQuestion.includes('yourself') || lowerQuestion.includes('introduce') || lowerQuestion.includes('background')) {
        contextParts.push(`Name: ${profile.name}, ${profile.title}`);
        contextParts.push(`Summary: ${profile.summary}`);
        if (profile.experience && profile.experience.length > 0) {
          contextParts.push(`Current Role: ${profile.experience[0].title} at ${profile.experience[0].company}`);
        }
      }

      // Projects-related questions
      if (lowerQuestion.includes('project') || lowerQuestion.includes('built') || lowerQuestion.includes('developed')) {
        if (profile.projects) {
          contextParts.push('Projects:');
          profile.projects.forEach(p => {
            contextParts.push(`- ${p.name}: ${p.description}`);
          });
        }
      }

      // Experience-related questions
      if (lowerQuestion.includes('experience') || lowerQuestion.includes('worked') || lowerQuestion.includes('company') || lowerQuestion.includes('job')) {
        if (profile.experience) {
          contextParts.push('Experience:');
          profile.experience.forEach(exp => {
            contextParts.push(`- ${exp.title} at ${exp.company} (${exp.duration})`);
            exp.highlights.forEach(h => contextParts.push(`  * ${h}`));
          });
        }
      }

      // IMPROVED: Smart skill detection - only send if personal experience is relevant
      if (isPersonalQuestion || usePersonalizedMode) {
        const techKeywords = {
          robotics: ['robot', 'ros', 'ros2', 'navigation', 'slam', 'manipulator', 'motion planning'],
          embedded: ['embed', 'microcontroller', 'adas', 'arduino', 'stm32', 'raspberry pi', 'autosar', 'can', 'lin', 'rtos'],
          programming: ['programming', 'language', 'python', 'c++', 'matlab', 'code'],
          ai_ml: ['ai', 'machine learning', 'reinforcement', 'tensorflow', 'pytorch', 'neural network', 'deep learning'],
          design: ['design', 'cad', 'fusion', 'solidworks', '3d print', 'modeling']
        };

        if (profile.skills) {
          let skillsAdded = false;

          // Only add skill categories that are mentioned in the question
          Object.entries(techKeywords).forEach(([category, keywords]) => {
            if (keywords.some(keyword => lowerQuestion.includes(keyword))) {
              if (!skillsAdded) {
                contextParts.push('Relevant Skills:');
                skillsAdded = true;
              }
              contextParts.push(`${category.charAt(0).toUpperCase() + category.slice(1).replace('_', '/')}: ${profile.skills[category].join(', ')}`);
            }
          });

          // IMPROVED: If Arduino is mentioned, also mention related projects
          if (lowerQuestion.includes('arduino')) {
            const arduinoProjects = profile.projects?.filter(p =>
              p.description.toLowerCase().includes('servo') ||
              p.description.toLowerCase().includes('microcontroller') ||
              p.name.toLowerCase().includes('robot')
            );
            if (arduinoProjects && arduinoProjects.length > 0 && !contextParts.some(c => c.includes('Projects:'))) {
              contextParts.push('Arduino-related Projects:');
              arduinoProjects.forEach(p => contextParts.push(`- ${p.name}`));
            }
          }
        }
      }

      // Education questions
      if (lowerQuestion.includes('education') || lowerQuestion.includes('degree') || lowerQuestion.includes('university') || lowerQuestion.includes('college')) {
        if (profile.education) {
          contextParts.push(`Education: ${profile.education.degree} from ${profile.education.institution} (${profile.education.year})`);
        }
      }

      // Specific project questions (robotic arm, rover, hexapod, etc.)
      const projectKeywords = {
        'robotic arm': 'Robotic Arm Manipulator',
        'manipulator': 'Robotic Arm Manipulator',
        'rover': 'Autonomous Navigation Rover',
        'navigation': 'Autonomous Navigation Rover',
        'balancing': 'Self-Balancing Robot',
        'hexapod': 'Hexapod Walking Robot',
        'adas': 'AI-Powered ADAS Demonstration'
      };

      Object.entries(projectKeywords).forEach(([keyword, projectName]) => {
        if (lowerQuestion.includes(keyword)) {
          const project = profile.projects?.find(p => p.name === projectName);
          if (project && !contextParts.some(c => c.includes(project.name))) {
            contextParts.push(`${project.name}: ${project.description}`);
          }
        }
      });

      // If no specific context matched but in personalized mode, send basic summary
      if (contextParts.length === 0 && usePersonalizedMode) {
        contextParts.push(`${profile.name} - ${profile.title}`);
        contextParts.push(`Summary: ${profile.summary}`);
      }

      return contextParts.length > 0 ? contextParts.join('\n') : null;
    } catch (error) {
      console.error('Error parsing personal context:', error);
      return personalContext; // Fallback to raw context
    }
  };

  // Open answer in separate popup window
  const openAnswerPopup = (question, answer) => {
    // Close previous popup if exists
    if (answerWindowRef.current && !answerWindowRef.current.closed) {
      answerWindowRef.current.close();
    }

    // Calculate position - bottom right of screen
    const width = 400;
    const height = 300;
    const left = window.screen.width - width - 20;
    const top = window.screen.height - height - 100;

    // Open new popup window
    const popupWindow = window.open(
      `/answer-popup.html?q=${encodeURIComponent(question)}`,
      'AI Answer',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,alwaysOnTop=yes`
    );

    // Send answer to popup once it loads
    if (popupWindow) {
      answerWindowRef.current = popupWindow;

      // Wait for popup to load then send answer
      setTimeout(() => {
        if (popupWindow && !popupWindow.closed) {
          popupWindow.postMessage({ type: 'answer', answer }, '*');
        }
      }, 500);
    }
  };

  const handleGetAnswer = async (question = transcript) => {
    if (!question.trim()) return;

    setIsProcessing(true);

    try {
      // Clean the question to remove duplicates and artifacts
      const cleanedQuestion = cleanQuestion(question);
      console.log('Original question:', question);
      console.log('Cleaned question:', cleanedQuestion);

      // Get smart context - only relevant parts based on the question
      const relevantContext = getRelevantContext(cleanedQuestion);

      // Enhanced logging to show intelligence
      if (relevantContext) {
        const contextLength = relevantContext.length;
        const tokenEstimate = Math.ceil(contextLength / 4); // Rough estimate: 1 token ≈ 4 chars
        console.log(`✅ Smart Context: ${tokenEstimate} tokens | Preview:`, relevantContext.substring(0, 150) + '...');
      } else {
        console.log('⚡ No personal context needed - using pure AI knowledge (saves tokens!)');
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: cleanedQuestion,
          conversationHistory: conversationContext,
          personalContext: relevantContext // Send only relevant context, not entire resume
        })
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        throw new Error(`API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('API Response:', data);

      if (data.content && data.content[0]) {
        const answer = data.content[0].text;
        setAiResponse(answer);
        setHistory(prev => [...prev, { question: cleanedQuestion, answer, timestamp: new Date() }]);

        // Open answer in popup window if enabled
        if (popupAnswers) {
          openAnswerPopup(cleanedQuestion, answer);
        }

        // Update conversation context with sliding window (keep only last 10 messages = 5 Q&A pairs)
        setConversationContext(prev => {
          const newContext = [
            ...prev,
            { role: 'user', content: cleanedQuestion },
            { role: 'assistant', content: answer }
          ];

          // Keep only last 10 messages (5 Q&A exchanges) to optimize token usage
          const MAX_CONTEXT_MESSAGES = 10;
          if (newContext.length > MAX_CONTEXT_MESSAGES) {
            return newContext.slice(-MAX_CONTEXT_MESSAGES);
          }
          return newContext;
        });
      } else {
        setAiResponse('Unable to get response. Please check your API key.');
      }
    } catch (error) {
      console.error('Full Error:', error);
      setAiResponse('Error: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const clearAll = () => {
    setTranscript('');
    setAiResponse('');
  };

  const clearContext = () => {
    setConversationContext([]);
    setTranscript('');
    setAiResponse('');
    alert('Conversation context cleared! Starting fresh.');
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('.drag-handle')) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y
      };
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      {/* Mode Selection Modal */}
      {showModeSelection && usePersonalizedMode === null && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-2xl p-8 max-w-md w-full border border-purple-500/50 shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Choose Your Mode
            </h2>
            <p className="text-gray-300 mb-6">
              Select how you want the AI assistant to respond during your interview:
            </p>

            <div className="space-y-4">
              {/* Generic Mode */}
              <button
                onClick={() => {
                  setUsePersonalizedMode(false);
                  setShowModeSelection(false);
                }}
                className="w-full p-6 bg-slate-800/50 hover:bg-slate-800 border border-purple-500/30 hover:border-purple-500/60 rounded-xl transition-all text-left group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center group-hover:bg-blue-600/30 transition-colors">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">Generic Mode</h3>
                    <p className="text-gray-400 text-sm">
                      General answers based on common knowledge. <strong className="text-green-400">Saves tokens</strong> - more cost effective.
                    </p>
                  </div>
                </div>
              </button>

              {/* Personalized Mode */}
              <button
                onClick={() => {
                  setUsePersonalizedMode(true);
                  setShowModeSelection(false);
                  setShowSettings(true);
                }}
                className="w-full p-6 bg-slate-800/50 hover:bg-slate-800 border border-purple-500/30 hover:border-purple-500/60 rounded-xl transition-all text-left group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center group-hover:bg-purple-600/30 transition-colors">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">Personalized Mode</h3>
                    <p className="text-gray-400 text-sm">
                      Answers based on your resume, projects & experience. <strong className="text-yellow-400">Uses extra tokens</strong> for context.
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-6 text-center">
              You can change this anytime from settings
            </p>
          </div>
        </div>
      )}

      {/* Floating Assistant Window */}
      <div
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: 9999,
          opacity: opacity / 100
        }}
        className="w-96 bg-black/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-500/30"
        onMouseDown={handleMouseDown}
      >
        {/* Header */}
        <div className="drag-handle cursor-move bg-gradient-to-r from-purple-600 to-blue-600 p-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-white" />
            <h2 className="text-white font-bold">AI Meeting Assistant</h2>
            {usePersonalizedMode !== null && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                usePersonalizedMode
                  ? 'bg-purple-500/30 text-purple-200'
                  : 'bg-blue-500/30 text-blue-200'
              }`} title={usePersonalizedMode ? 'Using personalized context' : 'Using generic mode'}>
                {usePersonalizedMode ? '🎯' : '⚡'}
              </span>
            )}
            {conversationContext.length > 0 && (
              <span className="text-xs text-white/80 bg-white/20 px-2 py-0.5 rounded-full" title="Last 5 Q&A pairs kept in memory">
                {Math.min(conversationContext.length / 2, 5)}/{Math.floor(conversationContext.length / 2)} msgs
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={clearContext}
              className="px-2 py-1 text-xs bg-white/20 hover:bg-white/30 text-white rounded transition-colors"
              title="Start New Conversation"
            >
              New Chat
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              title="View History"
            >
              <MessageSquare className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              title="Settings & Training"
            >
              <Settings className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="p-4 border-b border-purple-500/30 bg-slate-800/50 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold">Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-white text-xs"
              >
                Close
              </button>
            </div>

            {/* Mode Selection */}
            <div className="mb-4 p-3 bg-slate-900/50 rounded-lg">
              <label className="text-white text-sm font-semibold mb-2 block">Mode:</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setUsePersonalizedMode(false)}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    usePersonalizedMode === false
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  }`}
                >
                  ⚡ Generic
                </button>
                <button
                  onClick={() => setUsePersonalizedMode(true)}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    usePersonalizedMode === true
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  }`}
                >
                  🎯 Personalized
                </button>
              </div>
            </div>

            {/* Personalized Mode Training */}
            {usePersonalizedMode && (
              <div className="space-y-3">
                <div className="p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                  <p className="text-xs text-purple-300 mb-2">
                    📝 Add your personal information to get tailored responses
                  </p>
                </div>

                {/* Resume/Background */}
                <div>
                  <label className="text-white text-xs font-semibold mb-1 block">
                    Resume / Background:
                  </label>
                  <textarea
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="Paste your resume, experience, education, skills..."
                    className="w-full px-3 py-2 bg-slate-900 text-white text-xs rounded-lg border border-purple-500/30 focus:border-purple-500 focus:outline-none resize-none"
                    rows="4"
                  />
                </div>

                {/* GitHub URL */}
                <div>
                  <label className="text-white text-xs font-semibold mb-1 block">
                    GitHub URL (optional):
                  </label>
                  <input
                    type="text"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username"
                    className="w-full px-3 py-2 bg-slate-900 text-white text-xs rounded-lg border border-purple-500/30 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                {/* Save Profile Button */}
                <button
                  onClick={() => {
                    const profile = {
                      resumeText,
                      githubUrl,
                      timestamp: new Date().toISOString()
                    };
                    localStorage.setItem('interviewAssistantProfile', JSON.stringify(profile));
                    setPersonalContext(resumeText + (githubUrl ? `\n\nGitHub: ${githubUrl}` : ''));
                    alert('Profile saved successfully! 🎉');
                  }}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-lg transition-colors"
                >
                  💾 Save Profile
                </button>

                <p className="text-xs text-gray-500 text-center">
                  Your profile is saved locally in your browser
                </p>
              </div>
            )}

            {/* Auto-answer Setting */}
            <div className="mt-4 pt-4 border-t border-purple-500/20">
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  checked={autoAnswer}
                  onChange={(e) => setAutoAnswer(e.target.checked)}
                  className="w-4 h-4"
                />
                <label className="text-white text-xs">Auto-answer when question detected</label>
              </div>

              {/* Popup Answers Toggle */}
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  checked={popupAnswers}
                  onChange={(e) => setPopupAnswers(e.target.checked)}
                  className="w-4 h-4"
                />
                <label className="text-white text-xs">Show answers in floating popup window 🪟</label>
              </div>

              {/* Transparency Control */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-white text-xs font-semibold">Transparency:</label>
                  <span className="text-white text-xs">{opacity}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={opacity}
                  onChange={(e) => setOpacity(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${opacity}%, #334155 ${opacity}%, #334155 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>More transparent</span>
                  <span>Solid</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
          {/* Listening Status */}
          <div className="flex items-center justify-between">
            <button
              onClick={toggleListening}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                isListening
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4" />
                  Stop Listening
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  Start Listening
                </>
              )}
            </button>
            <button
              onClick={clearAll}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {isListening && (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              Listening...
            </div>
          )}

          {/* Transcript */}
          {transcript && (
            <div className="bg-slate-800/50 rounded-lg p-3 border border-purple-500/20">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-purple-400 text-sm font-semibold">Question Detected:</h3>
                <button
                  onClick={() => copyToClipboard(transcript)}
                  className="p-1 hover:bg-slate-700 rounded transition-colors"
                >
                  <Copy className="w-3 h-3 text-gray-400" />
                </button>
              </div>
              <p className="text-white text-sm">{transcript}</p>
              <button
                onClick={() => handleGetAnswer()}
                disabled={isProcessing}
                className="mt-2 w-full px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm font-semibold disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Get Answer'}
              </button>
            </div>
          )}

          {/* AI Response */}
          {aiResponse && (
            <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-lg p-3 border border-purple-500/30">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-blue-400 text-sm font-semibold">AI Answer:</h3>
                <button
                  onClick={() => copyToClipboard(aiResponse)}
                  className="p-1 hover:bg-slate-700 rounded transition-colors"
                >
                  <Copy className="w-3 h-3 text-gray-400" />
                </button>
              </div>
              <p className="text-white text-sm leading-relaxed">{aiResponse}</p>
            </div>
          )}

          {isProcessing && (
            <div className="flex items-center justify-center gap-2 text-purple-400">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200"></div>
            </div>
          )}
        </div>

        {/* History Panel */}
        {showHistory && history.length > 0 && (
          <div className="border-t border-purple-500/30 p-4 bg-slate-800/50 max-h-64 overflow-y-auto">
            <h3 className="text-white font-semibold mb-3">History</h3>
            {history.slice().reverse().map((item, idx) => (
              <div key={idx} className="mb-3 pb-3 border-b border-slate-700 last:border-0">
                <p className="text-purple-400 text-xs mb-1">{item.question}</p>
                <p className="text-gray-300 text-xs">{item.answer}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="max-w-4xl mx-auto mt-24 bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/20">
        <h1 className="text-4xl font-bold text-white mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          Real-Time AI Meeting Assistant
        </h1>

        <div className="space-y-6 text-gray-300">
          <div>
            <h2 className="text-xl font-semibold text-white mb-3">🚀 Quick Setup</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>Create a <code className="bg-slate-800 px-2 py-1 rounded text-purple-400">.env</code> file in your project root</li>
              <li>Add your API key: <code className="bg-slate-800 px-2 py-1 rounded text-purple-400">VITE_ANTHROPIC_API_KEY=your_key_here</code></li>
              <li>Restart the development server</li>
              <li>Click "Start Listening" to activate voice recognition</li>
              <li>The assistant will automatically detect questions and provide instant answers</li>
              <li>Drag the floating window anywhere on your screen</li>
            </ol>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">✨ Features</h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Real-time transcription:</strong> Captures audio and converts speech to text instantly</li>
              <li><strong>Auto-answer mode:</strong> Automatically responds when it detects a question</li>
              <li><strong>Smart AI responses:</strong> Powered by Claude for accurate, contextual answers</li>
              <li><strong>Floating overlay:</strong> Stays on top of all windows during meetings</li>
              <li><strong>Copy answers:</strong> One-click copy to clipboard</li>
              <li><strong>History tracking:</strong> Review past Q&A pairs</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">🎯 How to Use</h2>
            <p className="mb-3">Perfect for:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Job interviews - Get instant help with technical questions</li>
              <li>Client meetings - Quick facts and figures at your fingertips</li>
              <li>Presentations - Real-time answers to audience questions</li>
              <li>Training sessions - Support for complex topics</li>
            </ul>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <h3 className="text-yellow-400 font-semibold mb-2">⚠️ Important Notes</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Requires Chrome/Edge browser for speech recognition</li>
              <li>Allow microphone access when prompted</li>
              <li>Get your API key from <a href="https://console.anthropic.com" className="text-purple-400 hover:underline" target="_blank">console.anthropic.com</a></li>
              <li>Never commit your .env file to version control (add to .gitignore)</li>
              <li>Use responsibly and ethically in professional settings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
