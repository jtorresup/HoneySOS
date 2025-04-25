import { useEffect, useState, useRef } from 'react'
import { X, Settings, Plus, Trash2, Save, FolderOpen } from 'lucide-react'
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
}

function NotepadWindow({ onClose, noteToEdit }: NotepadWindowProps): JSX.Element {
  const [showMenu, setShowMenu] = useState(false)
  const [notes, setNotes] = useState<Note[]>([])
  const [openNoteIds, setOpenNoteIds] = useState<string[]>([])
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const savedNotes = localStorage.getItem('bee-notepad-notes')
    console.log('Saved notes:', savedNotes)

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
  }, []) // <--- only run on mount, NOT every time noteToEdit changes

  const handleAddNote = () => {
    const newNote: Note = {
      id: uuidv4(),
      title: `File${notes.length + 1}.txt`,
      content: ''
    }
    setNotes((prevNotes) => [...prevNotes, newNote])
    setOpenNoteIds((prev) => [...prev, newNote.id])
    setActiveNoteId(newNote.id)
    setShowMenu(false)
  }

  const handleDeleteNote = () => {
    if (!activeNoteId) return
    const filtered = notes.filter((note) => note.id !== activeNoteId)
    setNotes(filtered)
    setOpenNoteIds((prev) => prev.filter((id) => id !== activeNoteId))
    setActiveNoteId(filtered[0]?.id || null)
    setShowMenu(false)
  }

  const handleSaveNote = () => {
    setShowMenu(false)
  }

  const handleOpenNote = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        const content = reader.result as string
        const newNote: Note = {
          id: uuidv4(),
          title: file.name,
          content
        }
        setNotes([...notes, newNote])
        setOpenNoteIds((prev) => [...prev, newNote.id])
        setActiveNoteId(newNote.id)
      }
      reader.readAsText(file)
    }
    setShowMenu(false)
  }

  const updateActiveNoteContent = (newContent: string) => {
    setNotes((prevNotes) =>
      prevNotes.map((note) => (note.id === activeNoteId ? { ...note, content: newContent } : note))
    )
  }

  const activeNote = notes.find((note) => note.id === activeNoteId)

  return (
    <div className="absolute inset-0 bg-yellow-400 text-black font-sans z-20 flex flex-col">
      <div className="flex items-center justify-between p-2 bg-yellow-500 border-b-2 border-black relative">
        <div className="relative">
          <Settings
            className="w-5 h-5 text-black cursor-pointer"
            onClick={() => setShowMenu((prev) => !prev)}
          />
          {showMenu && (
            <div className="absolute left-0 top-8 bg-white border border-black rounded shadow-lg z-50 w-44">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center px-3 py-2 hover:bg-yellow-200"
              >
                <FolderOpen className="w-4 h-4 mr-2" /> Open Note
              </button>
              <input
                type="file"
                accept=".txt"
                ref={fileInputRef}
                className="hidden"
                onChange={handleOpenNote}
              />
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

        <img
          src={beeImage}
          alt="Bee"
          className="absolute right-4 top-0 w-20 h-20 object-contain pointer-events-none"
        />

        <button
          onClick={() => {
            localStorage.setItem('bee-notepad-notes', JSON.stringify(notes))
            onClose()
          }}
          className="text-black hover:text-red-600 px-3 text-xl font-bold"
        >
          ✕
        </button>
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
