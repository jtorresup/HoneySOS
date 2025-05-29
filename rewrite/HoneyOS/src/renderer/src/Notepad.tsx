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
  const [showNewNoteDialog, setShowNewNoteDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null)
  const [newNoteTitle, setNewNoteTitle] = useState('')
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

  // Add event listener for voice commands
  useEffect(() => {
    const handleNotepadAction = (event: CustomEvent) => {
      const { action } = event.detail
      switch (action) {
        case 'saveNote':
          handleSaveNote()
          break
        case 'addNote':
          handleAddNote()
          break
        case 'deleteNote':
          handleDeleteNote()
          break
      }
    }

    window.addEventListener('notepad-action', handleNotepadAction as EventListener)
    return () => {
      window.removeEventListener('notepad-action', handleNotepadAction as EventListener)
    }
  }, [onOpenFileManager])

  useEffect(() => {
    if (notes.length > 0) {
      localStorage.setItem('bee-notepad-notes', JSON.stringify(notes))
    }
  }, [notes])

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
    setShowNewNoteDialog(true)
    setShowMenu(false)
  }

  const confirmNewNote = (): void => {
    if (newNoteTitle.trim()) {
      const newNote: Note = {
        id: crypto.randomUUID(),
        title: newNoteTitle.trim(),
        content: ''
      }
      setNotes((prevNotes) => [...prevNotes, newNote])
      setOpenNoteIds((prev) => [...prev, newNote.id])
      setActiveNoteId(newNote.id)
    }
    setShowNewNoteDialog(false)
    setNewNoteTitle('')
  }

  const cancelNewNote = (): void => {
    setShowNewNoteDialog(false)
    setNewNoteTitle('')
  }

  const handleDeleteNote = (): void => {
    if (!activeNoteId) return
    const noteToDelete = notes.find((note) => note.id === activeNoteId)
    if (noteToDelete) {
      setNoteToDelete(noteToDelete)
      setShowDeleteDialog(true)
    }
    setShowMenu(false)
  }

  const confirmDelete = (): void => {
    if (noteToDelete) {
      setNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteToDelete.id))
      setOpenNoteIds((prev) => prev.filter((id) => id !== noteToDelete.id))

      const remainingNotes = notes.filter((note) => note.id !== noteToDelete.id)
      if (remainingNotes.length > 0) {
        setActiveNoteId(remainingNotes[0].id)
      } else {
        setActiveNoteId(null)
      }
    }
    setShowDeleteDialog(false)
    setNoteToDelete(null)
  }

  const cancelDelete = (): void => {
    setShowDeleteDialog(false)
    setNoteToDelete(null)
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

  const handleCloseNote = (noteId: string, e: React.MouseEvent): void => {
    e.stopPropagation()

    const noteToSave = notes.find((note) => note.id === noteId)
    if (noteToSave) {
      setNotes((prevNotes) =>
        prevNotes.map((note) =>
          note.id === noteId ? { ...note, content: noteToSave.content } : note
        )
      )
    }

    setOpenNoteIds((prev) => prev.filter((id) => id !== noteId))
    if (noteId === activeNoteId) {
      const remaining = openNoteIds.filter((id) => id !== noteId)
      setActiveNoteId(remaining[0] || null)
    }
  }

  const handleTabClick = (noteId: string): void => {
    if (activeNoteId) {
      const currentNote = notes.find((note) => note.id === activeNoteId)
      if (currentNote) {
        setNotes((prevNotes) =>
          prevNotes.map((note) =>
            note.id === activeNoteId ? { ...note, content: currentNote.content } : note
          )
        )
      }
    }

    setActiveNoteId(noteId)
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
                disabled={!activeNoteId}
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
              onClick={() => handleTabClick(note.id)}
              className={`flex items-center px-3 py-1 rounded border border-black shadow cursor-pointer ${
                activeNoteId === note.id ? 'bg-yellow-200' : 'bg-yellow-100'
              }`}
            >
              <span className="mr-2">{note.title}</span>
              <X
                className="w-4 h-4 hover:text-red-600"
                onClick={(e) => handleCloseNote(note.id, e)}
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

      {/* New Note Dialog */}
      {showNewNoteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 border-2 border-black">
            <h3 className="text-xl font-bold mb-4">Create New Note</h3>
            <div className="mb-4">
              <label htmlFor="noteTitle" className="block text-sm font-medium text-gray-700 mb-2">
                Note Title
              </label>
              <input
                type="text"
                id="noteTitle"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:border-yellow-500"
                placeholder="Enter note title"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newNoteTitle.trim()) {
                    confirmNewNote()
                  } else if (e.key === 'Escape') {
                    cancelNewNote()
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-4">
              <button
                onClick={cancelNewNote}
                className="px-4 py-2 rounded-lg border-2 border-black hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmNewNote}
                className="px-4 py-2 rounded-lg bg-yellow-500 text-black border-2 border-black hover:bg-yellow-600 transition-colors"
                disabled={!newNoteTitle.trim()}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && noteToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 border-2 border-black">
            <h3 className="text-xl font-bold mb-4">Delete Note</h3>
            <p className="mb-6">
              Are you sure you want to delete &quot;{noteToDelete.title}&quot;? This action cannot
              be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 rounded-lg border-2 border-black hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg bg-red-500 text-white border-2 border-black hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotepadWindow
