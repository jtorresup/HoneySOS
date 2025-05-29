"use client"

import { useState, useEffect, useRef } from "react"
import honeyBackground from "./assets/honeycomb-background.png"
import beeImage from "./assets/bee.png"

interface LoadingScreenProps {
    onLoadingComplete: () => void
}

export default function LoadingScreen({ onLoadingComplete }: LoadingScreenProps) {
    const [displayText, setDisplayText] = useState("")
    const [isTypingComplete, setIsTypingComplete] = useState(false)
    const [beePosition, setBeePosition] = useState({ x: 50, y: 50 })
    const [beeDirection, setBeeDirection] = useState({ x: 2, y: 1 })
    const welcomeText = "Welcome Honey Bun"
    const typewriterRef = useRef<NodeJS.Timeout>()
    const beeAnimationRef = useRef<NodeJS.Timeout>()
    const speechRef = useRef<SpeechSynthesisUtterance | null>(null)

    // Speak welcome message immediately on component mount
    useEffect(() => {
        const synth = window.speechSynthesis

        // Small delay to ensure speech synthesis is ready
        const timer = setTimeout(() => {
            const utterance = new SpeechSynthesisUtterance("Welcome Honey Bun")
            utterance.rate = 0.3
            utterance.pitch = 1.9
            utterance.volume = 0.8
            synth.speak(utterance)
        }, 300)

        return () => {
            clearTimeout(timer)
            synth.cancel()
        }
    }, [])

    // Bee flying animation
    useEffect(() => {
        const animateBee = () => {
            setBeePosition((prev) => {
                let newX = prev.x + beeDirection.x
                let newY = prev.y + beeDirection.y
                let newDirectionX = beeDirection.x
                let newDirectionY = beeDirection.y

                // Bounce off walls
                if (newX <= 0 || newX >= 90) {
                    newDirectionX = -newDirectionX
                    newX = Math.max(0, Math.min(90, newX))
                }
                if (newY <= 0 || newY >= 80) {
                    newDirectionY = -newDirectionY
                    newY = Math.max(0, Math.min(80, newY))
                }

                setBeeDirection({ x: newDirectionX, y: newDirectionY })
                return { x: newX, y: newY }
            })
        }

        beeAnimationRef.current = setInterval(animateBee, 100)
        return () => {
            if (beeAnimationRef.current) {
                clearInterval(beeAnimationRef.current)
            }
        }
    }, [beeDirection])

    // Typewriter effect
    useEffect(() => {
        let currentIndex = 0

        const typeNextCharacter = () => {
            if (currentIndex < welcomeText.length) {
                setDisplayText(welcomeText.slice(0, currentIndex + 1))
                currentIndex++
                typewriterRef.current = setTimeout(typeNextCharacter, 150)
            } else {
                setIsTypingComplete(true)
            }
        }

        // Start typing after a short delay
        const startDelay = setTimeout(typeNextCharacter, 1000)

        return () => {
            clearTimeout(startDelay)
            if (typewriterRef.current) {
                clearTimeout(typewriterRef.current)
            }
        }
    }, [])

    // Final voice message and completion
    useEffect(() => {
        if (isTypingComplete) {
            const timer = setTimeout(() => {
                const synth = window.speechSynthesis
                const utterance = new SpeechSynthesisUtterance("What can I do for you today?")
                utterance.rate = 0.9
                utterance.pitch = 1.1

                utterance.onend = () => {
                    // Complete loading immediately after speech ends
                    onLoadingComplete()
                }

                synth.speak(utterance)
            }, 1500)

            return () => clearTimeout(timer)
        }
    }, [isTypingComplete, onLoadingComplete])

    return (
        <div
            className="fixed inset-0 bg-cover bg-center flex items-center justify-center overflow-hidden"
            style={{
                backgroundImage: `url(${honeyBackground})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}
        >
            {/* Overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 via-yellow-400/20 to-orange-500/20" />

            {/* Animated background particles */}
            <div className="absolute inset-0">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-2 h-2 bg-white/30 rounded-full animate-pulse"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 2}s`,
                            animationDuration: `${2 + Math.random() * 2}s`,
                        }}
                    />
                ))}
            </div>

            {/* Flying bee using the bee.png image */}
            <div
                className="absolute transition-all duration-100 ease-linear z-20"
                style={{
                    left: `${beePosition.x}%`,
                    top: `${beePosition.y}%`,
                    transform: `translate(-50%, -50%) ${beeDirection.x > 0 ? "scaleX(1)" : "scaleX(-1)"}`,
                }}
            >
                <img
                    src={beeImage || "/placeholder.svg"}
                    alt="Flying Bee"
                    className="w-12 h-12 object-contain"
                    style={{
                        filter: "drop-shadow(0 0 8px rgba(255, 255, 255, 0.5))",
                    }}
                />
            </div>

            {/* Main content with fixed positioning */}
            <div className="text-center z-10 relative">
                {/* Loading dots */}
                <div className="flex justify-center space-x-2 mb-8">
                    {[...Array(3)].map((_, i) => (
                        <div
                            key={i}
                            className="w-3 h-3 bg-white/80 rounded-full animate-bounce shadow-lg"
                            style={{
                                animationDelay: `${i * 0.2}s`,
                                animationDuration: "1s",
                            }}
                        />
                    ))}
                </div>

                {/* Welcome text with typewriter effect - Fixed width and left-aligned typing */}
                <div className="mb-8">
                    <div
                        className="text-6xl font-bold text-white drop-shadow-2xl font-mono mx-auto"
                        style={{
                            width: "600px", // Fixed width to prevent shifting
                            height: "80px", // Fixed height
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-start", // Left align the text
                            textAlign: "left",
                        }}
                    >
                        <span>{displayText}</span>
                        <span className="animate-pulse text-yellow-300">|</span>
                    </div>
                </div>

                {/* Boot-like status messages - Fixed width and height */}
                <div
                    className="text-white/90 text-sm font-mono bg-black/20 rounded-lg backdrop-blur-sm mx-auto"
                    style={{
                        width: "400px", // Fixed width
                        height: "120px", // Fixed height
                        padding: "16px",
                    }}
                >
                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <span>Initializing Honey OS...</span>
                            <span className="text-green-300">✓</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Loading voice recognition...</span>
                            <span className="text-green-300">✓</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Preparing workspace...</span>
                            <span className="text-green-300">✓</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Starting applications...</span>
                            <span className={isTypingComplete ? "text-green-300" : "text-yellow-300"}>
                                {isTypingComplete ? "✓" : "..."}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Progress bar - Fixed width */}
                <div
                    className="mt-8 h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm mx-auto"
                    style={{ width: "320px" }} // Fixed width
                >
                    <div
                        className="h-full bg-gradient-to-r from-white to-yellow-200 rounded-full transition-all duration-1000 ease-out shadow-lg"
                        style={{
                            width: isTypingComplete ? "100%" : `${(displayText.length / welcomeText.length) * 100}%`,
                        }}
                    />
                </div>
            </div>
        </div>
    )
}
