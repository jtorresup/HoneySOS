"use client"

import { useState, useEffect, useRef } from "react"
import LoadingScreen from "./loading-screen"
import honeyBackground from "./assets/honeycomb-background.png"
import folderIcon from "./assets/folder.png"
import notepadIcon from "./assets/notepad.png"
import memoryIcon from "./assets/memory.png"
import replacementIcon from "./assets/replacement.png"
import MemoryManager from "./MemoryManagement"
import ReplacementAlgorithm from "./ReplacementAlgorithm"
import micIcon from "./assets/micIcon.png"
import cameraIcon from "./assets/camera.png"
import NotepadWindow from "./Notepad"
import FileManager from "./FileManager"
import CameraComponent from "./CameraComponent"
import PhotoGallery from "./PhotoGallery"
import galleryIcon from "./assets/gallery.png"
import TicTacToe from "./TicTacToe"
import ticTacToeIcon from "./assets/tic-tac-toe.png"

interface Note {
  id: string
  content: string
  title: string
}

type WindowType = "notepad" | "fileManager" | "camera" | "memory" | "replacement" | "photoGallery" | "ticTacToe" | null

function App(): JSX.Element {
  const [isLoading, setIsLoading] = useState(true)
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
  const [isTicTacToeOpen, setIsTicTacToeOpen] = useState(false)
  const [isTicTacToeHover, setIsTicTacToeHover] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [response, setResponse] = useState('')
  const [liveTranscript, setLiveTranscript] = useState('')
  const recognitionRef = useRef(null)
  const showNoteManagerRef = useRef(showNoteManager)
  const isCameraOpenRef = useRef(isCameraOpen)
  const isMemoryOpenRef = useRef(isMemoryOpen)
  const isReplacementOpenRef = useRef(isReplacementOpen)
  const isNotepadOpenRef = useRef(isNotepadOpen)
  const isPhotoGalleryOpenRef = useRef(isPhotoGalleryOpen)
  const isTicTacToeOpenRef = useRef(isTicTacToeOpen)

  useEffect(() => {
    showNoteManagerRef.current = showNoteManager
  }, [showNoteManager])

  useEffect(() => {
    isCameraOpenRef.current = isCameraOpen
  }, [isCameraOpen])

  useEffect(() => {
    isMemoryOpenRef.current = isMemoryOpen
  }, [isMemoryOpen])

  useEffect(() => {
    isReplacementOpenRef.current = isReplacementOpen
  }, [isReplacementOpen])

  useEffect(() => {
    isNotepadOpenRef.current = isNotepadOpen
  }, [isNotepadOpen])

  useEffect(() => {
    isPhotoGalleryOpenRef.current = isPhotoGalleryOpen
  }, [isPhotoGalleryOpen])

  useEffect(() => {
    isTicTacToeOpenRef.current = isTicTacToeOpen
  }, [isTicTacToeOpen])

  const handleCommand = (text: string): void => {
    const command = text.toLowerCase().trim()

    // Greeting commands
    if (command.includes('hello honey')) {
      console.log('Command matched: hello honey')
      respond('Hello! How can I help you today?')
      return
    }

    // Memory Management commands
    if (isMemoryOpenRef.current) {
      // Process add command
      if (command.includes('please add process')) {
        console.log('Command matched: add process')
        const event = new CustomEvent('memory-action', { detail: { action: 'addProcess' } })
        window.dispatchEvent(event)
        respond('Adding a new process')
        return
      }

      // Algorithm selection commands
      if (command.includes('please set mode first come')) {
        console.log('Command matched: set mode FCFS')
        const event = new CustomEvent('memory-action', {
          detail: { action: 'setAlgorithm', algorithm: 'FCFS' }
        })
        window.dispatchEvent(event)
        respond('Switching to FCFS mode')
        return
      }
      if (command.includes('please set mode short job')) {
        console.log('Command matched: set mode SJF')
        const event = new CustomEvent('memory-action', {
          detail: { action: 'setAlgorithm', algorithm: 'SJF' }
        })
        window.dispatchEvent(event)
        respond('Switching to SJF mode')
        return
      }
      if (command.includes('please set mode priority')) {
        console.log('Command matched: set mode Priority')
        const event = new CustomEvent('memory-action', {
          detail: { action: 'setAlgorithm', algorithm: 'PRIORITY' }
        })
        window.dispatchEvent(event)
        respond('Switching to Priority mode')
        return
      }
      if (command.includes('please set mode round robin')) {
        console.log('Command matched: set mode Round Robin')
        const event = new CustomEvent('memory-action', {
          detail: { action: 'setAlgorithm', algorithm: 'RR' }
        })
        window.dispatchEvent(event)
        respond('Switching to Round Robin mode')
        return
      }

      // Control commands
      if (command.includes('please start simulation')) {
        console.log('Command matched: start simulation')
        const event = new CustomEvent('memory-action', { detail: { action: 'startSimulation' } })
        window.dispatchEvent(event)
        respond('Starting simulation')
        return
      }
      if (command.includes('please stop simulation')) {
        console.log('Command matched: stop simulation')
        const event = new CustomEvent('memory-action', { detail: { action: 'stopSimulation' } })
        window.dispatchEvent(event)
        respond('Stopping simulation')
        return
      }
      if (command.includes('please reset simulation')) {
        console.log('Command matched: reset simulation')
        const event = new CustomEvent('memory-action', { detail: { action: 'resetSimulation' } })
        window.dispatchEvent(event)
        respond('Resetting simulation')
        return
      }
    }

    // Camera commands
    if (isCameraOpenRef.current) {
      if (command.includes('please take photo') || command.includes('please take picture')) {
        console.log('Command matched: take photo')
        const event = new CustomEvent('camera-action', { detail: { action: 'takePhoto' } })
        window.dispatchEvent(event)
        respond('Taking a photo')
        return
      }
      if (command.includes('please retake') || command.includes('please take another')) {
        console.log('Command matched: retake photo')
        const event = new CustomEvent('camera-action', { detail: { action: 'retakePhoto' } })
        window.dispatchEvent(event)
        respond('Retaking the photo')
        return
      }
    }

    // Notepad commands
    if (isNotepadOpenRef.current) {
      if (command.includes('please save note')) {
        console.log('Command matched: save note')
        const event = new CustomEvent('notepad-action', { detail: { action: 'saveNote' } })
        window.dispatchEvent(event)
        respond('Saving note')
        return
      }
      if (command.includes('please add note') || command.includes('please create new note')) {
        console.log('Command matched: add note')
        const event = new CustomEvent('notepad-action', { detail: { action: 'addNote' } })
        window.dispatchEvent(event)
        respond('Creating new note')
        return
      }
      if (command.includes('please delete note')) {
        console.log('Command matched: delete note')
        const event = new CustomEvent('notepad-action', { detail: { action: 'deleteNote' } })
        window.dispatchEvent(event)
        respond('Deleting note')
        return
      }
    }

    // Replacement Algorithm commands
    if (isReplacementOpenRef.current) {
      if (command.includes('please set mode')) {
        if (command.includes('first come')) {
          console.log('Command matched: set mode FIFO')
          const event = new CustomEvent('replacement-action', {
            detail: { action: 'setAlgorithm', algorithm: 'FIFO' }
          })
          window.dispatchEvent(event)
          respond('Setting FIFO mode')
          return
        }
        if (command.includes('lru')) {
          console.log('Command matched: set mode LRU')
          const event = new CustomEvent('replacement-action', {
            detail: { action: 'setAlgorithm', algorithm: 'LRU' }
          })
          window.dispatchEvent(event)
          respond('Setting LRU mode')
          return
        }
        if (command.includes('opt')) {
          console.log('Command matched: set mode OPT')
          const event = new CustomEvent('replacement-action', {
            detail: { action: 'setAlgorithm', algorithm: 'OPT' }
          })
          window.dispatchEvent(event)
          respond('Setting OPT mode')
          return
        }
        if (command.includes('lfu')) {
          console.log('Command matched: set mode LFU')
          const event = new CustomEvent('replacement-action', {
            detail: { action: 'setAlgorithm', algorithm: 'LFU' }
          })
          window.dispatchEvent(event)
          respond('Setting LFU mode')
          return
        }
      }
      if (command.includes('please generate reference')) {
        console.log('Command matched: generate reference')
        const event = new CustomEvent('replacement-action', {
          detail: { action: 'generateReference' }
        })
        window.dispatchEvent(event)
        respond('Generating new reference string')
        return
      }
      if (command.includes('please start simulation')) {
        console.log('Command matched: start simulation')
        const event = new CustomEvent('replacement-action', {
          detail: { action: 'startSimulation' }
        })
        window.dispatchEvent(event)
        respond('Starting simulation')
        return
      }
      if (command.includes('please stop simulation')) {
        console.log('Command matched: stop simulation')
        const event = new CustomEvent('replacement-action', {
          detail: { action: 'stopSimulation' }
        })
        window.dispatchEvent(event)
        respond('Stopping simulation')
        return
      }
      if (command.includes('please reset simulation')) {
        console.log('Command matched: reset simulation')
        const event = new CustomEvent('replacement-action', {
          detail: { action: 'resetSimulation' }
        })
        window.dispatchEvent(event)
        respond('Resetting simulation')
        return
      }
    }

    // File Manager commands
    if (showNoteManagerRef.current) {
      if (command.includes('please create new note') || command.includes('please add new note')) {
        console.log('Command matched: create note')
        const event = new CustomEvent('file-manager-action', {
          detail: { action: 'createNote' }
        })
        window.dispatchEvent(event)
        respond('Creating a new note')
        return
      }
      if (command.includes('please open note')) {
        const match = command.match(/please open note(?: called)? (.+)/)
        const noteTitle = match?.[1]?.trim()
        console.log('Command matched: open note, title:', noteTitle)
        if (noteTitle) {
          const event = new CustomEvent('file-manager-action', {
            detail: { action: 'openNote', title: noteTitle }
          })
          window.dispatchEvent(event)
          respond(`Opening note: ${noteTitle}`)
        } else {
          respond('Please specify which note to open. For example: "please open note my note"')
        }
        return
      }
      if (command.includes('please delete note')) {
        const noteTitle = command.split('please delete note')[1]?.trim()
        console.log('Command matched: delete note, title:', noteTitle)
        if (noteTitle) {
          const event = new CustomEvent('file-manager-action', {
            detail: { action: 'deleteNote', title: noteTitle }
          })
          window.dispatchEvent(event)
          respond(`Deleting note: ${noteTitle}`)
        } else {
          respond('Please specify which note to delete. For example: "please delete note my note"')
        }
        return
      }
    }

    // Window opening commands
    if (command.includes('please open')) {
      if (command.includes('file manager')) {
        console.log('Command matched: open file manager')
        handleOpenFileManager()
        respond('Opening file manager')
      } else if (command.includes('notepad')) {
        console.log('Command matched: open notepad')
        handleOpenNotepad()
        respond('Opening notepad')
      } else if (command.includes('camera')) {
        console.log('Command matched: open camera')
        handleOpenCamera()
        respond('Opening camera')
      } else if (command.includes('memory')) {
        console.log('Command matched: open memory')
        handleOpenMemory()
        respond('Opening memory management')
      } else if (command.includes('replacement')) {
        console.log('Command matched: open replacement')
        handleOpenReplacement()
        respond('Opening replacement algorithm')
      } else if (command.includes('photo gallery')) {
        console.log('Command matched: open photo gallery')
        handleOpenPhotoGallery()
        respond('Opening photo gallery')
      } else if (command.includes('game')) {
        console.log('Command matched: open game')
        handleOpenTicTacToe()
        respond('Opening tic tac toe game')
      }
      return
    }

    // Window closing commands
    if (command.includes('please close')) {
      if (command.includes('file manager')) {
        console.log('Command matched: close file manager')
        setShowNoteManager(false)
        respond('Closing file manager')
      } else if (command.includes('notepad')) {
        console.log('Command matched: close notepad')
        setIsNotepadOpen(false)
        respond('Closing notepad')
      } else if (command.includes('camera')) {
        console.log('Command matched: close camera')
        setIsCameraOpen(false)
        respond('Closing camera')
      } else if (command.includes('memory')) {
        console.log('Command matched: close memory')
        setIsMemoryOpen(false)
        respond('Closing memory management')
      } else if (command.includes('replacement')) {
        console.log('Command matched: close replacement')
        setIsReplacementOpen(false)
        respond('Closing replacement algorithm')
      } else if (command.includes('photo gallery')) {
        console.log('Command matched: close photo gallery')
        setIsPhotoGalleryOpen(false)
        respond('Closing photo gallery')
      } else if (command.includes('game')) {
        console.log('Command matched: close game')
        setIsTicTacToeOpen(false)
        respond('Closing tic tac toe game')
      }
      return
    }

    // Other commands
    if (command.includes('how are you')) {
      console.log('Command matched: how are you')
      respond("I'm doing well, thank you for asking!")
    } else if (command.includes('tell me a joke')) {
      console.log('Command matched: tell me a joke')
      respond("Why don't scientists trust atoms? Because they make up everything!")
    } else if (command.includes('stop listening')) {
      console.log('Command matched: stop listening')
      respond('Okay, stopping voice recognition')
      stopListening()
    } else if (command.includes('what can you do')) {
      console.log('Command matched: what can you do')
      respond(
        'I can help you with file management. When the file manager is open, try: ' +
          '"please create note" to create a new note, ' +
          '"please open note [filename]" to open a specific note, ' +
          '"please delete note [filename]" to delete a note. ' +
          'I can also help you open and close windows, tell jokes, and have a conversation. ' +
          'Just say "hello honey" to start!'
      )
    } else {
      console.log('No matching command found for:', command)
    }
  }

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert('Your browser does not support Speech Recognition.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      let interimTranscript = ''
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript.toLowerCase()
        if (event.results[i].isFinal) {
          finalTranscript += text + ' '
          handleCommand(text)
        } else {
          interimTranscript += text
        }
      }

      // Show interim + final together
      setTranscript((prev) => prev + finalTranscript)
      setLiveTranscript(interimTranscript) // ⬅️ Optional: use this for live feedback
    }

    recognition.onend = () => {
      if (isListening) {
        setTimeout(() => recognition.start(), 500) // slight buffer
      }
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
    }

    recognitionRef.current = recognition
  }, [handleCommand, showNoteManager])

  const respond = (message: string): void => {
    setResponse(message)
    const utterance = new SpeechSynthesisUtterance(message)
    utterance.lang = 'en-US'
    window.speechSynthesis.speak(utterance)
  }

   const handleLoadingComplete = () => {
    setIsLoading(false)
  }

  const startListening = (): void => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch (error) {
        console.error("Failed to start recognition:", error)
      }
    }
  }

  const stopListening = (): void => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop()
        setIsListening(false)
      } catch (error) {
        console.error('Failed to stop recognition:', error)
      }
    }
  }

  const toggleListening = (): void => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const formatTime = (): string => {
    let hours = time.getHours()
    const minutes = time.getMinutes()
    const ampm = hours >= 12 ? "PM" : "AM"
    hours = hours % 12 || 12
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes
    return `${hours}:${formattedMinutes} ${ampm}`
  }

  const formatDate = (): string => {
    return time.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  const handleWindowClick = (windowType: WindowType): void => {
    setActiveWindow(windowType)
  }

  const getWindowZIndex = (windowType: WindowType): number => {
    return activeWindow === windowType ? 50 : 20
  }

  // Add handlers for opening windows
  const handleOpenNotepad = () => {
    setSelectedNote(null)
    setIsNotepadOpen(true)
    setActiveWindow("notepad")
  }

  const handleOpenFileManager = () => {
    setShowNoteManager(true)
    setActiveWindow("fileManager")
  }

  const handleOpenCamera = () => {
    setIsCameraOpen(true)
    setActiveWindow("camera")
  }

  const handleOpenMemory = () => {
    setIsMemoryOpen(true)
    setActiveWindow("memory")
  }

  const handleOpenReplacement = () => {
    setIsReplacementOpen(true)
    setActiveWindow("replacement")
  }

  const openNotepadWithNote = (note: Note): void => {
    setSelectedNote(note)
    setIsNotepadOpen(true)
    setShowNoteManager(false)
    setActiveWindow("notepad")
  }

  const handleOpenPhotoGallery = () => {
    setIsPhotoGalleryOpen(true)
    setActiveWindow("photoGallery")
  }

  const handleOpenTicTacToe = () => {
    setIsTicTacToeOpen(true)
    setActiveWindow("ticTacToe")
  }

  // Show loading screen first
  if (isLoading) {
    return <LoadingScreen onLoadingComplete={handleLoadingComplete} />
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-amber-500 salsa-regular">
      <div
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: `url(${honeyBackground})`, backgroundSize: "cover" }}
      >
        <div className="flex flex-col items-center justify-center absolute top-1/4 left-1/2 transform -translate-x-1/2">
          <h1 className="text-white text-7xl font-bold tracking-tight drop-shadow-lg">{formatTime()}</h1>
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
              src={folderIcon || "/placeholder.svg"}
              alt="Folder"
              className={`w-8 h-8 ${isFolderHover ? "scale-110" : ""} transition-all duration-300`}
            />
          </div>

          <div
            className="flex flex-col items-center justify-center cursor-pointer rounded-full hover:bg-black/20 transition-all duration-300 w-16 h-16"
            onMouseEnter={() => setIsNotepadHover(true)}
            onMouseLeave={() => setIsNotepadHover(false)}
            onClick={handleOpenNotepad}
          >
            <img
              src={notepadIcon || "/placeholder.svg"}
              alt="Notepad"
              className={`w-8 h-8 ${isNotepadHover ? "scale-110" : ""} transition-all duration-300`}
            />
          </div>

          <div
            className="flex flex-col items-center justify-center cursor-pointer rounded-full hover:bg-black/20 transition-all duration-300 w-16 h-16"
            onMouseEnter={() => setIsMemoryHover(true)}
            onMouseLeave={() => setIsMemoryHover(false)}
            onClick={handleOpenMemory}
          >
            <img
              src={memoryIcon || "/placeholder.svg"}
              alt="Memory Management"
              className={`w-8 h-8 ${isMemoryHover ? "scale-110" : ""} transition-all duration-300`}
            />
          </div>

          <div
            className="flex flex-col items-center justify-center cursor-pointer rounded-full hover:bg-black/20 transition-all duration-300 w-16 h-16"
            onMouseEnter={() => setIsReplacementHover(true)}
            onMouseLeave={() => setIsReplacementHover(false)}
            onClick={handleOpenReplacement}
          >
            <img
              src={replacementIcon || "/placeholder.svg"}
              alt="Replacement Algorithm"
              className={`w-8 h-8 ${isReplacementHover ? "scale-110" : ""} transition-all duration-300`}
            />
          </div>

          <div
            className={`flex flex-col items-center justify-center cursor-pointer rounded-full hover:bg-black/20 ${isListening ? 'bg-green-500/20' : ''} transition-all duration-300 w-16 h-16`}
            onClick={toggleListening}
          >
            <img src={micIcon || "/placeholder.svg"} alt="Mic Icon" className="w-8 h-8" />
          </div>

          <div
            className="flex flex-col items-center justify-center cursor-pointer rounded-full hover:bg-black/20 transition-all duration-300 w-16 h-16"
            onClick={handleOpenCamera}
          >
            <img src={cameraIcon || "/placeholder.svg"} alt="Camera Icon" className="w-full h-full object-contain" />
          </div>

          <div
            className="flex flex-col items-center justify-center cursor-pointer rounded-full hover:bg-black/20 transition-all duration-300 w-16 h-16"
            onClick={handleOpenPhotoGallery}
          >
            <img src={galleryIcon || "/placeholder.svg"} alt="Photo Gallery" className="w-8 h-8" />
          </div>

          <div
            className="flex flex-col items-center justify-center cursor-pointer rounded-full hover:bg-black/20 transition-all duration-300 w-16 h-16"
            onMouseEnter={() => setIsTicTacToeHover(true)}
            onMouseLeave={() => setIsTicTacToeHover(false)}
            onClick={handleOpenTicTacToe}
          >
            <img
              src={ticTacToeIcon || "/placeholder.svg"}
              alt="Tic Tac Toe"
              className={`w-8 h-8 ${isTicTacToeHover ? "scale-110" : ""} transition-all duration-300`}
            />
          </div>
        </div>

        <div className="relative">
          {isNotepadOpen && (
            <div
              className="absolute"
              style={{
                zIndex: getWindowZIndex("notepad"),
                width: "100%",
                height: "100%",
              }}
              onClick={() => handleWindowClick("notepad")}
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
                zIndex: getWindowZIndex("fileManager"),
                width: "100%",
                height: "100%",
              }}
              onClick={() => handleWindowClick("fileManager")}
            >
              <FileManager onClose={() => setShowNoteManager(false)} onNoteSelect={openNotepadWithNote} />
            </div>
          )}
          {isCameraOpen && (
            <div
              className="absolute"
              style={{
                zIndex: getWindowZIndex("camera"),
                width: "100%",
                height: "100%",
              }}
              onClick={() => handleWindowClick("camera")}
            >
              <CameraComponent onClose={() => setIsCameraOpen(false)} />
            </div>
          )}
          {isMemoryOpen && (
            <div
              className="absolute"
              style={{
                zIndex: getWindowZIndex("memory"),
                width: "100%",
                height: "100%",
              }}
              onClick={() => handleWindowClick("memory")}
            >
              <MemoryManager onClose={() => setIsMemoryOpen(false)} />
            </div>
          )}
          {isReplacementOpen && (
            <div
              className="absolute"
              style={{
                zIndex: getWindowZIndex("replacement"),
                width: "100%",
                height: "100%",
              }}
              onClick={() => handleWindowClick("replacement")}
            >
              <ReplacementAlgorithm onClose={() => setIsReplacementOpen(false)} />
            </div>
          )}
          {isPhotoGalleryOpen && (
            <div
              className="absolute"
              style={{
                zIndex: getWindowZIndex("photoGallery"),
                width: "100%",
                height: "100%",
              }}
              onClick={() => handleWindowClick("photoGallery")}
            >
              <PhotoGallery onClose={() => setIsPhotoGalleryOpen(false)} />
            </div>
          )}
          {isTicTacToeOpen && (
            <div
              className="absolute"
              style={{
                zIndex: getWindowZIndex("ticTacToe"),
                width: "100%",
                height: "100%",
              }}
              onClick={() => handleWindowClick("ticTacToe")}
            >
              <TicTacToe onClose={() => setIsTicTacToeOpen(false)} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
