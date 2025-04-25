import React, { useState, useEffect } from 'react'
import honeyBackground from './assets/honeycomb-background.png'
import folderIcon from './assets/folder.png'
import notepadIcon from './assets/notepad.png'
import NotepadWindow from './Notepad'
import FileManager from './FileManager'

type Note = {
  id: string
  title: string
  content: string
}

function App(): JSX.Element {
  const [time, setTime] = useState(new Date())
  const [isFolderHover, setIsFolderHover] = useState(false)
  const [isNotepadHover, setIsNotepadHover] = useState(false)
  const [showNoteManager, setShowNoteManager] = useState(false)
  const [isNotepadOpen, setIsNotepadOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const synth = window.speechSynthesis

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.lang = 'en-US'
      recognition.interimResults = false

      let isActivated = false

      const speak = (text: string) => {
        const utterance = new SpeechSynthesisUtterance(text)
        synth.speak(utterance)
      }

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[event.results.length - 1][0].transcript
          .trim()
          .toLowerCase()
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
          } else if (transcript.includes('please open file manager')) {
            setShowNoteManager(true)
          } else if (transcript.includes('please close notepad')) {
            setIsNotepadOpen(false)
          } else if (transcript.includes('please close file manager')) {
            setShowNoteManager(false)
          } else if (transcript.includes("i'm mad") || transcript.includes('i am mad')) {
            speak("I'm sorry for being useless. I will try to be better.")
          }

          // Reset after command
          isActivated = false
        }
      }

      recognition.onerror = (e) => {
        console.error('Speech recognition error', e)
      }

      recognition.start()

      return () => {
        clearInterval(timer)
        recognition.stop()
      }
    } else {
      console.warn('SpeechRecognition API not supported')
      return () => clearInterval(timer)
    }
  }, [])

  const formatTime = () => {
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

  const openNotepadWithNote = (note: Note) => {
    setSelectedNote(note)
    setIsNotepadOpen(true)
    setShowNoteManager(false)
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-amber-500 salsa-regular">
      <div
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: `url(${honeyBackground})`, backgroundSize: 'cover' }}
      >
        {/* Time and date display */}
        <div className="flex flex-col items-center justify-center absolute top-1/4 left-1/2 transform -translate-x-1/2">
          <h1 className="text-white text-8xl font-bold tracking-tight drop-shadow-lg">
            {formatTime()}
          </h1>
          <p className="text-white text-3xl mt-2 font-light tracking-wide">{formatDate()}</p>
        </div>

        {/* Folder icon */}
        <div
          className="flex flex-col items-center justify-center cursor-pointer absolute z-10 bottom-34 left-40 rounded-full hover:bg-black/20 transition-all duration-300 w-32 h-32"
          onMouseEnter={() => setIsFolderHover(true)}
          onMouseLeave={() => setIsFolderHover(false)}
          onClick={() => setShowNoteManager(true)}
        >
          <img
            src={folderIcon}
            alt="Folder"
            className={`w-12 h-12 ${isFolderHover ? 'scale-110' : ''} transition-all duration-300`}
          />
        </div>

        {/* Notepad icon */}
        <div
          className="flex flex-col items-center justify-center cursor-pointer absolute z-10 left-70 bottom-10 rounded-full hover:bg-black/20 transition-all duration-300 w-32 h-32"
          onMouseEnter={() => setIsNotepadHover(true)}
          onMouseLeave={() => setIsNotepadHover(false)}
          onClick={() => {
            setSelectedNote(null)
            setNotepadOpen(true)
          }}
        >
          <img
            src={notepadIcon}
            alt="Notepad"
            className={`w-12 h-12 ${isNotepadHover ? 'scale-110' : ''} transition-all duration-300`}
          />
        </div>

        {/* Windows */}
        {isNotepadOpen && (
          <NotepadWindow onClose={() => setIsNotepadOpen(false)} noteToEdit={selectedNote} />
        )}
        {showNoteManager && (
          <FileManager
            onClose={() => setShowNoteManager(false)}
            onNoteSelect={openNotepadWithNote}
          />
        )}
      </div>
    </div>
  )
}

export default App
