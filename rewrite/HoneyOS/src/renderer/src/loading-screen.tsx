"use client"

import { useState, useEffect, useRef } from "react"
import honeyBackground from "./assets/yellowbg.jpg"
import beeImage from "./assets/bee.png"

interface LoadingScreenProps {
  onLoadingComplete: () => void
}

export default function LoadingScreen({ onLoadingComplete }: LoadingScreenProps) {
  const [displayText, setDisplayText] = useState("")
  const [isTypingComplete, setIsTypingComplete] = useState(false)
  const [beePosition, setBeePosition] = useState({ x: 50, y: 50 })
  const [beeDirection, setBeeDirection] = useState({ x: 2, y: 1 })
  const [isStarted, setIsStarted] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [currentStatus, setCurrentStatus] = useState(0)

  const welcomeText = "Welcome Honey Bun"
  const typewriterRef = useRef<NodeJS.Timeout>()
  const beeAnimationRef = useRef<NodeJS.Timeout>()
  const speechRef = useRef<boolean>(false) // Track if speech has been spoken

  const statusMessages = [
    "Initializing Honey OS...",
    "Loading voice recognition...",
    "Preparing workspace...",
    "Starting applications...",
  ]

  // Start the loading sequence
  const handleStart = () => {
    console.log("Starting Honey OS")
    setIsStarted(true)
    speechRef.current = false // Reset speech tracking
  }

  // Consolidated speech and loading logic
  useEffect(() => {
    if (!isStarted || speechRef.current) return

    console.log("Starting welcome sequence")
    speechRef.current = true // Mark speech as started

    const synth = window.speechSynthesis

    // Start typewriter effect immediately
    let currentIndex = 0
    const typeNextCharacter = () => {
      if (currentIndex < welcomeText.length) {
        setDisplayText(welcomeText.slice(0, currentIndex + 1))
        currentIndex++
        typewriterRef.current = setTimeout(typeNextCharacter, 120)
      } else {
        setIsTypingComplete(true)
      }
    }

    // Start typing after a short delay
    const startTyping = setTimeout(typeNextCharacter, 800)

    // Speak welcome message
    const speakWelcome = setTimeout(() => {
      console.log("Speaking welcome message")
      const utterance = new SpeechSynthesisUtterance("Welcome Honey Bun")
      utterance.lang = "en-US"
      utterance.rate = 0.8
      utterance.pitch = 1.2
      utterance.volume = 0.8

      utterance.onend = () => {
        console.log("Welcome message completed, speaking final message")
        // Speak final message after welcome
        const finalUtterance = new SpeechSynthesisUtterance("Enjoy Honey OS")
        finalUtterance.lang = "en-US"
        finalUtterance.rate = 0.9
        finalUtterance.pitch = 1.1

        finalUtterance.onend = () => {
          console.log("All speech completed")
          setTimeout(() => onLoadingComplete(), 1000)
        }

        finalUtterance.onerror = () => {
          console.error("Speech synthesis error on final message")
          setTimeout(() => onLoadingComplete(), 1000)
        }

        try {
          synth.speak(finalUtterance)
        } catch (error) {
          console.error("Failed to speak final message:", error)
          setTimeout(() => onLoadingComplete(), 1000)
        }
      }

      utterance.onerror = () => {
        console.error("Speech synthesis error on welcome message")
        setTimeout(() => onLoadingComplete(), 3000)
      }

      try {
        synth.speak(utterance)
      } catch (error) {
        console.error("Failed to speak welcome message:", error)
        setTimeout(() => onLoadingComplete(), 3000)
      }
    }, 1200)

    // Safety timeout
    const safetyTimer = setTimeout(() => {
      console.log("Safety timeout triggered")
      onLoadingComplete()
    }, 8000)

    return () => {
      clearTimeout(startTyping)
      clearTimeout(speakWelcome)
      clearTimeout(safetyTimer)
      if (typewriterRef.current) {
        clearTimeout(typewriterRef.current)
      }
      synth.cancel()
    }
  }, [isStarted, onLoadingComplete])

  // Bee flying animation
  useEffect(() => {
    if (!isStarted) return

    const animateBee = () => {
      setBeePosition((prev) => {
        let newX = prev.x + beeDirection.x
        let newY = prev.y + beeDirection.y
        let newDirectionX = beeDirection.x
        let newDirectionY = beeDirection.y

        // Bounce off walls with some randomness
        if (newX <= 5 || newX >= 85) {
          newDirectionX = -newDirectionX + (Math.random() - 0.5) * 0.5
          newX = Math.max(5, Math.min(85, newX))
        }
        if (newY <= 5 || newY >= 75) {
          newDirectionY = -newDirectionY + (Math.random() - 0.5) * 0.5
          newY = Math.max(5, Math.min(75, newY))
        }

        setBeeDirection({ x: newDirectionX, y: newDirectionY })
        return { x: newX, y: newY }
      })
    }

    beeAnimationRef.current = setInterval(animateBee, 80)
    return () => {
      if (beeAnimationRef.current) {
        clearInterval(beeAnimationRef.current)
      }
    }
  }, [isStarted, beeDirection])

  // Progress and status animation
  useEffect(() => {
    if (!isStarted) return

    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        const newProgress = Math.min(prev + Math.random() * 15, 100)

        // Update status based on progress
        if (newProgress > 25 && currentStatus < 1) setCurrentStatus(1)
        if (newProgress > 50 && currentStatus < 2) setCurrentStatus(2)
        if (newProgress > 75 && currentStatus < 3) setCurrentStatus(3)

        return newProgress
      })
    }, 200)

    return () => clearInterval(progressInterval)
  }, [isStarted, currentStatus])

  return (
    <div
      className="fixed inset-0 bg-cover bg-center flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: `url(${honeyBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Floating particles */}
      <div className="absolute inset-0">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 bg-white/40 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
              transform: `scale(${0.5 + Math.random() * 0.5})`,
            }}
          />
        ))}
      </div>

      {/* Start Button */}
      {!isStarted && (
        <div className="text-center z-10 relative">
          <div className="mb-6">
            <div className="text-6xl mb-4">🍯</div>
            <h1 className="text-4xl font-bold text-amber-800 mb-2">Honey Bun OS</h1>
            <p className="text-amber-700 mb-8">Your sweet digital experience awaits</p>
          </div>
          <button
            onClick={handleStart}
            className="px-12 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white text-2xl font-bold rounded-full shadow-xl transform hover:scale-105 transition-all duration-300 border-2 border-amber-400"
          >
            🐝 Start Honey OS
          </button>
        </div>
      )}

      {/* Loading Content */}
      {isStarted && (
        <>
          {/* Flying bee with trail effect */}
          <div
            className="absolute transition-all duration-75 ease-linear z-20"
            style={{
              left: `${beePosition.x}%`,
              top: `${beePosition.y}%`,
              transform: `translate(-50%, -50%) ${beeDirection.x > 0 ? "scaleX(1)" : "scaleX(-1)"}`,
            }}
          >
            <div className="relative">
              {/* Bee trail */}
              <div className="absolute inset-0 animate-ping">
                <img src={beeImage || "/placeholder.svg"} alt="" className="w-12 h-12 object-contain opacity-30" />
              </div>
              {/* Main bee */}
              <img
                src={beeImage || "/placeholder.svg"}
                alt="Flying Bee"
                className="w-12 h-12 object-contain relative z-10"
                style={{
                  filter: "drop-shadow(0 0 8px rgba(255, 255, 255, 0.5))",
                }}
              />
            </div>
          </div>

          {/* Main content with fixed width container */}
          <div className="text-center z-10 relative w-[500px] mx-auto">
            {/* Honey pot loading animation */}
            <div className="mb-8">
              <div className="text-8xl mb-4 animate-bounce">🍯</div>
              <div className="flex justify-center space-x-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-4 h-4 bg-amber-500 rounded-full animate-bounce shadow-lg"
                    style={{
                      animationDelay: `${i * 0.3}s`,
                      animationDuration: "1.2s",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Welcome text with fixed dimensions */}
            <div className="mb-8 h-24 flex items-center justify-center">
              <div className="text-6xl font-bold text-amber-800 drop-shadow-lg font-mono w-full">
                <span className="bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                  {displayText}
                </span>
                <span className="animate-pulse text-amber-500 ml-1">|</span>
              </div>
            </div>

            {/* Enhanced status panel with fixed width */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-amber-200 mb-6 w-full">
              <div className="space-y-3">
                {statusMessages.map((message, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-amber-800 font-medium">{message}</span>
                    <span className={`text-xl ${index <= currentStatus ? "text-green-500" : "text-amber-300"}`}>
                      {index <= currentStatus ? "✓" : "⏳"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Enhanced progress bar with fixed width */}
            <div className="relative w-full">
              <div className="h-4 bg-amber-200 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-full transition-all duration-500 ease-out shadow-lg relative"
                  style={{ width: `${Math.max(loadingProgress, (displayText.length / welcomeText.length) * 100)}%` }}
                >
                  <div className="absolute inset-0 bg-white/30 animate-pulse rounded-full" />
                </div>
              </div>
              <div className="text-center mt-2 text-amber-700 font-semibold">
                {Math.round(Math.max(loadingProgress, (displayText.length / welcomeText.length) * 100))}%
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
