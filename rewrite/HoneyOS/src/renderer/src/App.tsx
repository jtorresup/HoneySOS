'use client'

import { useState, useEffect, useRef } from 'react'
import honeyBackground from './assets/honeycomb-background.png'
import folderIcon from './assets/folder.png'
import notepadIcon from './assets/notepad.png'
import memoryIcon from './assets/memory.png'
import replacementIcon from './assets/replacement.png'
import MemoryManager from './MemoryManagement'
import ReplacementAlgorithm from './ReplacementAlgorithm'
import micIcon from './assets/micIcon.png'
import cameraIcon from './assets/camera.png'
import NotepadWindow from './Notepad'
import FileManager from './FileManager'
import CameraComponent from './CameraComponent'
import axios from 'axios'
import PhotoGallery from './PhotoGallery'
import galleryIcon from './assets/gallery.png'

interface Note {
  id: string
  content: string
  title: string
}

type WindowType =
  | 'notepad'
  | 'fileManager'
  | 'camera'
  | 'memory'
  | 'replacement'
  | 'photoGallery'
  | null

function App(): JSX.Element {
  const [time, setTime] = useState(new Date())
  const [isFolderHover, setIsFolderHover] = useState(false)
  const [isNotepadHover, setIsNotepadHover] = useState(false)
  const [isMemoryHover, setIsMemoryHover] = useState(false)
  const [isReplacementHover, setIsReplacementHover] = useState(false)
  const [showNoteManager, setShowNoteManager] = useState(false)
  const [isNotepadOpen, setIsNotepadOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [isMemoryOpen, setIsMemoryOpen] = useState(false)
  const [isReplacementOpen, setIsReplacementOpen] = useState(false)
  const [activeWindow, setActiveWindow] = useState<WindowType>(null)
  const [isPhotoGalleryOpen, setIsPhotoGalleryOpen] = useState(false)

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const isRecognitionActiveRef = useRef(false)

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const synth = window.speechSynthesis

    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API not supported')
      return
    }

    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    recognition.continuous = true
    recognition.lang = 'en-US'
    recognition.interimResults = false

    let isActivated = false

    const speak = (text: string) => {
      const utterance = new SpeechSynthesisUtterance(text)
      synth.speak(utterance)
    }

    recognition.onstart = () => {
      isRecognitionActiveRef.current = true
      console.log('Speech recognition started')
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase()
      console.log('Heard:', transcript)

      if (!isActivated && transcript.includes('hello honey')) {
        isActivated = true
        speak('What can I do for you today?')
        return
      }

      if (isActivated) {
        if (transcript.includes('please open notepad')) {
          setSelectedNote(null)
          setIsNotepadOpen(true)
          speak('Opening notepad')
        } else if (transcript.includes('please open file manager')) {
          setShowNoteManager(true)
          speak('Opening file manager')
        } else if (transcript.includes('please close notepad')) {
          setIsNotepadOpen(false)
          speak('Closing notepad')
        } else if (transcript.includes('please close file manager')) {
          setShowNoteManager(false)
          speak('Closing file manager')
        } else if (transcript.includes("i'm mad") || transcript.includes('i am mad')) {
          speak("I'm sorry for being useless. I will try to be better.")
        } else {
          speak("I didn't understand that command. Please try again.")
        }

        isActivated = false
      }
    }

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error', e)
    }

    recognition.onend = () => {
      isRecognitionActiveRef.current = false
    }

    return () => {
      recognition.stop()
    }
  }, [])

  const startListening = () => {
    const recognition = recognitionRef.current
    if (recognition && !isRecognitionActiveRef.current) {
      try {
        recognition.start()
      } catch (error) {
        console.error('Failed to start recognition:', error)
      }
    }
  }

  const formatTime = (): string => {
    let hours = time.getHours()
    const minutes = time.getMinutes()
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12 || 12
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes
    return `${hours}:${formattedMinutes} ${ampm}`
  }

  const formatDate = (): string => {
    return time.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleWindowClick = (windowType: WindowType): void => {
    setActiveWindow(windowType)
  }

  const getWindowZIndex = (windowType: WindowType): number => {
    return activeWindow === windowType ? 50 : 20
  }

  // Add handlers for opening windows
  const handleOpenNotepad = (): void => {
    setSelectedNote(null)
    setIsNotepadOpen(true)
    setActiveWindow('notepad')
  }

  const handleOpenFileManager = (): void => {
    setShowNoteManager(true)
    setActiveWindow('fileManager')
  }

  const handleOpenCamera = (): void => {
    setIsCameraOpen(true)
    setActiveWindow('camera')
  }

  const handleOpenMemory = (): void => {
    setIsMemoryOpen(true)
    setActiveWindow('memory')
  }

  const handleOpenReplacement = (): void => {
    setIsReplacementOpen(true)
    setActiveWindow('replacement')
  }

  const openNotepadWithNote = (note: Note): void => {
    setSelectedNote(note)
    setIsNotepadOpen(true)
    setShowNoteManager(false)
    setActiveWindow('notepad')
  }

  const handleOpenPhotoGallery = (): void => {
    setIsPhotoGalleryOpen(true)
    setActiveWindow('photoGallery')
  }

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-amber-500 salsa-regular">
      <div
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: `url(${honeyBackground})`, backgroundSize: 'cover' }}
      >
        <div className="flex flex-col items-center justify-center absolute top-1/4 left-1/2 transform -translate-x-1/2">
          <h1 className="text-white text-7xl font-bold tracking-tight drop-shadow-lg">
            {formatTime()}
          </h1>
          <p className="text-white text-3xl mt-2 font-light tracking-wide">{formatDate()}</p>
        </div>

        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex space-x-8 bg-black/30 rounded-lg p-4">
          <div
            className="flex flex-col items-center justify-center cursor-pointer rounded-full hover:bg-black/20 transition-all duration-300 w-16 h-16"
            onMouseEnter={() => setIsFolderHover(true)}
            onMouseLeave={() => setIsFolderHover(false)}
            onClick={handleOpenFileManager}
          >
            <img
              src={folderIcon}
              alt="Folder"
              className={`w-8 h-8 ${isFolderHover ? 'scale-110' : ''} transition-all duration-300`}
            />
          </div>

          <div
            className="flex flex-col items-center justify-center cursor-pointer rounded-full hover:bg-black/20 transition-all duration-300 w-16 h-16"
            onMouseEnter={() => setIsNotepadHover(true)}
            onMouseLeave={() => setIsNotepadHover(false)}
            onClick={handleOpenNotepad}
          >
            <img
              src={notepadIcon}
              alt="Notepad"
              className={`w-8 h-8 ${isNotepadHover ? 'scale-110' : ''} transition-all duration-300`}
            />
          </div>

          <div
            className="flex flex-col items-center justify-center cursor-pointer rounded-full hover:bg-black/20 transition-all duration-300 w-16 h-16"
            onMouseEnter={() => setIsMemoryHover(true)}
            onMouseLeave={() => setIsMemoryHover(false)}
            onClick={handleOpenMemory}
          >
            <img
              src={memoryIcon}
              alt="Memory Management"
              className={`w-8 h-8 ${isMemoryHover ? 'scale-110' : ''} transition-all duration-300`}
            />
          </div>

          <div
            className="flex flex-col items-center justify-center cursor-pointer rounded-full hover:bg-black/20 transition-all duration-300 w-16 h-16"
            onMouseEnter={() => setIsReplacementHover(true)}
            onMouseLeave={() => setIsReplacementHover(false)}
            onClick={handleOpenReplacement}
          >
            <img
              src={replacementIcon}
              alt="Replacement Algorithm"
              className={`w-8 h-8 ${isReplacementHover ? 'scale-110' : ''} transition-all duration-300`}
            />
          </div>

          <div
            className="flex flex-col items-center justify-center cursor-pointer rounded-full hover:bg-black/20 transition-all duration-300 w-16 h-16"
            onClick={startListening}
          >
            <img src={micIcon} alt="Mic Icon" className="w-8 h-8" />
          </div>

          <div
            className="flex flex-col items-center justify-center cursor-pointer rounded-full hover:bg-black/20 transition-all duration-300 w-16 h-16"
            onClick={handleOpenCamera}
          >
            <img src={cameraIcon} alt="Camera Icon" className="w-full h-full object-contain" />
          </div>

          <div
            className="flex flex-col items-center justify-center cursor-pointer rounded-full hover:bg-black/20 transition-all duration-300 w-16 h-16"
            onClick={handleOpenPhotoGallery}
          >
            <img src={galleryIcon} alt="Photo Gallery" className="w-8 h-8" />
          </div>
        </div>

        <div className="relative">
          {isNotepadOpen && (
            <div
              className="absolute"
              style={{
                zIndex: getWindowZIndex('notepad'),
                width: '100%',
                height: '100%'
              }}
              onClick={() => handleWindowClick('notepad')}
            >
              <NotepadWindow
                onClose={() => setIsNotepadOpen(false)}
                noteToEdit={selectedNote}
                onOpenFileManager={() => {
                  setIsNotepadOpen(false)
                  handleOpenFileManager()
                }}
              />
            </div>
          )}
          {showNoteManager && (
            <div
              className="absolute"
              style={{
                zIndex: getWindowZIndex('fileManager'),
                width: '100%',
                height: '100%'
              }}
              onClick={() => handleWindowClick('fileManager')}
            >
              <FileManager
                onClose={() => setShowNoteManager(false)}
                onNoteSelect={openNotepadWithNote}
              />
            </div>
          )}
          {isCameraOpen && (
            <div
              className="absolute"
              style={{
                zIndex: getWindowZIndex('camera'),
                width: '100%',
                height: '100%'
              }}
              onClick={() => handleWindowClick('camera')}
            >
              <CameraComponent onClose={() => setIsCameraOpen(false)} />
            </div>
          )}
          {isMemoryOpen && (
            <div
              className="absolute"
              style={{
                zIndex: getWindowZIndex('memory'),
                width: '100%',
                height: '100%'
              }}
              onClick={() => handleWindowClick('memory')}
            >
              <MemoryManager onClose={() => setIsMemoryOpen(false)} />
            </div>
          )}
          {isReplacementOpen && (
            <div
              className="absolute"
              style={{
                zIndex: getWindowZIndex('replacement'),
                width: '100%',
                height: '100%'
              }}
              onClick={() => handleWindowClick('replacement')}
            >
              <ReplacementAlgorithm onClose={() => setIsReplacementOpen(false)} />
            </div>
          )}
          {isPhotoGalleryOpen && (
            <div
              className="absolute"
              style={{
                zIndex: getWindowZIndex('photoGallery'),
                width: '100%',
                height: '100%'
              }}
              onClick={() => handleWindowClick('photoGallery')}
            >
              <PhotoGallery onClose={() => setIsPhotoGalleryOpen(false)} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
