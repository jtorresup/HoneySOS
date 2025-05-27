import { useEffect, useState, useRef } from 'react'
import { X, Settings, Plus, Trash2, Save, FolderOpen, Maximize2, Minimize2 } from 'lucide-react'
import beeImage from './assets/bee.png'
import { v4 as uuidv4 } from 'uuid'

interface Note {
  id: string
  title: string
  content: string
}

interface NotepadWindowProps {
  onClose: () => void
  noteToEdit?: Note | null
  onOpenFileManager: () => void
}

function NotepadWindow({
  onClose,
  noteToEdit,
  onOpenFileManager
}: NotepadWindowProps): JSX.Element {
  const [showMenu, setShowMenu] = useState(false)
  const [notes, setNotes] = useState<Note[]>([])
  const [openNoteIds, setOpenNoteIds] = useState<string[]>([])
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const windowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const savedNotes = localStorage.getItem('bee-notepad-notes')
    const parsed: Note[] = savedNotes ? JSON.parse(savedNotes) : []

    if (noteToEdit) {
      const exists = parsed.find((n) => n.id === noteToEdit.id)
      if (!exists) {
        parsed.push(noteToEdit)
      }
      setOpenNoteIds([noteToEdit.id])
      setActiveNoteId(noteToEdit.id)
    }

    setNotes(parsed)
  }, [noteToEdit])

  const handleMouseDown = (e: React.MouseEvent): void => {
    if (e.target instanceof HTMLElement && e.target.closest('.window-header')) {
      setIsDragging(true)
      const rect = windowRef.current?.getBoundingClientRect()
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        })
      }
    }
  }

  const handleMouseMove = (e: MouseEvent): void => {
    if (isDragging && windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect()
      const maxX = window.innerWidth - rect.width
      const maxY = window.innerHeight - rect.height

      const newX = Math.min(Math.max(0, e.clientX - dragOffset.x), maxX)
      const newY = Math.min(Math.max(0, e.clientY - dragOffset.y), maxY)

      setPosition({ x: newX, y: newY })
    }
  }

  const handleMouseUp = (): void => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  const handleAddNote = (): void => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: `File${notes.length + 1}.txt`,
      content: ''
    }
    setNotes((prevNotes) => [...prevNotes, newNote])
    setOpenNoteIds((prev) => [...prev, newNote.id])
    setActiveNoteId(newNote.id)
    setShowMenu(false)
  }

  const handleDeleteNote = (): void => {
    if (!activeNoteId) return
    const filtered = notes.filter((note) => note.id !== activeNoteId)
    setNotes(filtered)
    setOpenNoteIds((prev) => prev.filter((id) => id !== activeNoteId))
    setActiveNoteId(filtered[0]?.id || null)
    setShowMenu(false)
  }

  const handleSaveNote = (): void => {
    localStorage.setItem('bee-notepad-notes', JSON.stringify(notes))
    setShowMenu(false)
  }

  const handleOpenNote = (): void => {
    onOpenFileManager()
    setShowMenu(false)
  }

  const updateActiveNoteContent = (newContent: string): void => {
    setNotes((prevNotes) =>
      prevNotes.map((note) => (note.id === activeNoteId ? { ...note, content: newContent } : note))
    )
  }

  const activeNote = notes.find((note) => note.id === activeNoteId)

  return (
    <div
      ref={windowRef}
      className={`fixed bg-yellow-400 text-black font-sans z-20 flex flex-col rounded-lg shadow-2xl border-2 border-black transition-all duration-200 ${
        isExpanded ? 'inset-4' : 'w-3/4 h-3/4'
      }`}
      style={{
        transform: isExpanded ? 'none' : `translate(${position.x}px, ${position.y}px)`,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="window-header flex items-center justify-between p-2 bg-yellow-500 border-b-2 border-black relative rounded-t-lg cursor-grab active:cursor-grabbing">
        <div className="relative">
          <Settings
            className="w-5 h-5 text-black cursor-pointer"
            onClick={() => setShowMenu((prev) => !prev)}
          />
          {showMenu && (
            <div className="absolute left-0 top-8 bg-white border border-black rounded shadow-lg z-50 w-44">
              <button
                onClick={handleOpenNote}
                className="w-full flex items-center px-3 py-2 hover:bg-yellow-200"
              >
                <FolderOpen className="w-4 h-4 mr-2" /> Open Note
              </button>
              <button
                onClick={handleAddNote}
                className="w-full flex items-center px-3 py-2 hover:bg-yellow-200"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Note
              </button>
              <button
                onClick={handleDeleteNote}
                className="w-full flex items-center px-3 py-2 hover:bg-yellow-200"
                disabled={notes.length <= 1}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete Note
              </button>
              <button
                onClick={handleSaveNote}
                className="w-full flex items-center px-3 py-2 hover:bg-yellow-200"
              >
                <Save className="w-4 h-4 mr-2" /> Save Note
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-black hover:text-yellow-200"
          >
            {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
          <button
            onClick={() => {
              handleSaveNote()
              onClose()
            }}
            className="text-black hover:text-red-600 px-3 text-xl font-bold"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="flex space-x-2 bg-yellow-300 border-b-2 border-black px-4 py-2 overflow-x-auto">
        {notes
          .filter((note) => openNoteIds.includes(note.id))
          .map((note) => (
            <div
              key={note.id}
              onClick={() => setActiveNoteId(note.id)}
              className={`flex items-center px-3 py-1 rounded border border-black shadow cursor-pointer ${
                activeNoteId === note.id ? 'bg-yellow-200' : 'bg-yellow-100'
              }`}
            >
              <span className="mr-2">{note.title}</span>
              <X
                className="w-4 h-4 hover:text-red-600"
                onClick={(e) => {
                  e.stopPropagation()
                  setOpenNoteIds((prev) => prev.filter((id) => id !== note.id))
                  if (note.id === activeNoteId) {
                    const remaining = openNoteIds.filter((id) => id !== note.id)
                    setActiveNoteId(remaining[0] || null)
                  }
                }}
              />
            </div>
          ))}
      </div>

      <textarea
        className="flex-grow bg-white p-6 text-base outline-none resize-none font-mono"
        placeholder="Start typing..."
        value={activeNote?.content || ''}
        onChange={(e) => updateActiveNoteContent(e.target.value)}
      />
    </div>
  )
}

export default NotepadWindow
