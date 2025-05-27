"use client"

import { useState, useEffect } from "react"
import honeyBackground from "./assets/honeycomb-background.png"
import folderIcon from "./assets/folder.png"
import notepadIcon from "./assets/notepad.png"
import memoryIcon from "./assets/memory.png"
import replacementIcon from "./assets/replacement.png"
import MemoryManager from "./MemoryManagement.tsx"
import ReplacementAlgorithm from "./ReplacementAlgorithm.tsx"
import TicTacToe from "./TicTacToe.tsx"
import ticTacToeIcon from "./assets/tic-tac-toe.png"

function App() {
  const [activeApp, setActiveApp] = useState<"desktop" | "folder" | "notepad" | "memory" | "replacement" | "tictactoe">(
    "desktop",
  )
  const [isFolderHover, setIsFolderHover] = useState(false)
  const [isNotepadHover, setIsNotepadHover] = useState(false)
  const [isMemoryHover, setIsMemoryHover] = useState(false)
  const [isReplacementHover, setIsReplacementHover] = useState(false)
  const [isTicTacToeHover, setIsTicTacToeHover] = useState(false)

  useEffect(() => {
    document.body.style.backgroundImage = `url(${honeyBackground})`
    document.body.style.backgroundSize = "cover"
    document.body.style.backgroundRepeat = "no-repeat"
    document.body.style.backgroundAttachment = "fixed"

    return () => {
      document.body.style.backgroundImage = ""
      document.body.style.backgroundSize = ""
      document.body.style.backgroundRepeat = ""
      document.body.style.backgroundAttachment = ""
    }
  }, [])

  const FolderApp = () => {
    return (
      <div className="absolute top-0 left-0 w-full h-full bg-white/80 backdrop-blur-sm z-50">
        <button
          onClick={() => setActiveApp("desktop")}
          className="absolute top-4 left-4 bg-red-500 text-white p-2 rounded-md"
        >
          Close
        </button>
        Folder App Content
      </div>
    )
  }

  const NotepadApp = () => {
    return (
      <div className="absolute top-0 left-0 w-full h-full bg-white/80 backdrop-blur-sm z-50">
        <button
          onClick={() => setActiveApp("desktop")}
          className="absolute top-4 left-4 bg-red-500 text-white p-2 rounded-md"
        >
          Close
        </button>
        Notepad App Content
      </div>
    )
  }

  return (
    <div className="App">
      {activeApp === "desktop" && (
        <div className="absolute top-0 left-0 w-full h-full">
          {/* Folder Icon */}
          <div
            className="flex flex-col items-center justify-center cursor-pointer absolute z-10 bottom-20 left-10 rounded-full hover:bg-black/20 transition-all duration-300 w-32 h-32"
            onMouseEnter={() => setIsFolderHover(true)}
            onMouseLeave={() => setIsFolderHover(false)}
            onClick={() => setActiveApp("folder")}
          >
            <img
              src={folderIcon || "/placeholder.svg"}
              alt="Folder"
              className={`w-12 h-12 ${isFolderHover ? "scale-110" : ""} transition-all duration-300`}
            />
          </div>

          {/* Notepad Icon */}
          <div
            className="flex flex-col items-center justify-center cursor-pointer absolute z-10 bottom-20 left-60 rounded-full hover:bg-black/20 transition-all duration-300 w-32 h-32"
            onMouseEnter={() => setIsNotepadHover(true)}
            onMouseLeave={() => setIsNotepadHover(false)}
            onClick={() => setActiveApp("notepad")}
          >
            <img
              src={notepadIcon || "/placeholder.svg"}
              alt="Notepad"
              className={`w-12 h-12 ${isNotepadHover ? "scale-110" : ""} transition-all duration-300`}
            />
          </div>

          {/* Memory Manager Icon */}
          <div
            className="flex flex-col items-center justify-center cursor-pointer absolute z-10 bottom-20 left-110 rounded-full hover:bg-black/20 transition-all duration-300 w-32 h-32"
            onMouseEnter={() => setIsMemoryHover(true)}
            onMouseLeave={() => setIsMemoryHover(false)}
            onClick={() => setActiveApp("memory")}
          >
            <img
              src={memoryIcon || "/placeholder.svg"}
              alt="Memory Manager"
              className={`w-12 h-12 ${isMemoryHover ? "scale-110" : ""} transition-all duration-300`}
            />
          </div>

          {/* Replacement Algorithm Icon */}
          <div
            className="flex flex-col items-center justify-center cursor-pointer absolute z-10 bottom-20 left-140 rounded-full hover:bg-black/20 transition-all duration-300 w-32 h-32"
            onMouseEnter={() => setIsReplacementHover(true)}
            onMouseLeave={() => setIsReplacementHover(false)}
            onClick={() => setActiveApp("replacement")}
          >
            <img
              src={replacementIcon || "/placeholder.svg"}
              alt="Replacement Algorithm"
              className={`w-12 h-12 ${isReplacementHover ? "scale-110" : ""} transition-all duration-300`}
            />
          </div>

          {/* Tic Tac Toe Icon */}
          <div
            className="flex flex-col items-center justify-center cursor-pointer absolute z-10 bottom-20 left-170 rounded-full hover:bg-black/20 transition-all duration-300 w-32 h-32"
            onMouseEnter={() => setIsTicTacToeHover(true)}
            onMouseLeave={() => setIsTicTacToeHover(false)}
            onClick={() => setActiveApp("tictactoe")}
          >
            <img
              src={ticTacToeIcon || "/placeholder.svg"}
              alt="Tic Tac Toe"
              className={`w-12 h-12 ${isTicTacToeHover ? "scale-110" : ""} transition-all duration-300`}
            />
          </div>
        </div>
      )}

      {activeApp === "folder" && <FolderApp />}
      {activeApp === "notepad" && <NotepadApp />}
      {activeApp === "memory" && <MemoryManager />}
      {activeApp === "replacement" && <ReplacementAlgorithm />}
      {activeApp === "tictactoe" && <TicTacToe />}
    </div>
  )
}

export default App
