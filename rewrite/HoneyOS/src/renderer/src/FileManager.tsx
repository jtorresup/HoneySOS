import { useState, useEffect, useRef } from 'react'
import { X, Maximize2, Minimize2, Folder, FileText, Plus, Trash2 } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

interface Note {
  id: string
  content: string
  title: string
}

interface FileManagerProps {
  onClose: () => void
  onNoteSelect: (note: Note) => void
}

function FileManager({ onClose, onNoteSelect }: FileManagerProps): JSX.Element {
  const [notes, setNotes] = useState<Note[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null)
  const [showNewNoteDialog, setShowNewNoteDialog] = useState(false)
  const [newNoteTitle, setNewNoteTitle] = useState('')
  const windowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const storedNotes = localStorage.getItem('bee-notepad-notes')
    if (storedNotes) {
      try {
        const parsed = JSON.parse(storedNotes)
        setNotes(parsed)
      } catch (err) {
        console.error('Failed to parse notes:', err)
      }
    }
  }, [])

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

  const handleSelectNote = (note: Note): void => {
    onNoteSelect(note)
    onClose()
  }

  const handleNewNote = (): void => {
    setShowNewNoteDialog(true)
  }

  const confirmNewNote = (): void => {
    if (newNoteTitle.trim()) {
      const newNote: Note = {
        id: uuidv4(),
        title: newNoteTitle.trim(),
        content: ''
      }
      onNoteSelect(newNote)
      onClose()
    }
    setShowNewNoteDialog(false)
    setNewNoteTitle('')
  }

  const cancelNewNote = (): void => {
    setShowNewNoteDialog(false)
    setNewNoteTitle('')
  }

  const handleDeleteNote = (note: Note, e: React.MouseEvent): void => {
    e.stopPropagation()
    setNoteToDelete(note)
  }

  const confirmDelete = (): void => {
    if (noteToDelete) {
      const updatedNotes = notes.filter((note) => note.id !== noteToDelete.id)
      setNotes(updatedNotes)
      localStorage.setItem('bee-notepad-notes', JSON.stringify(updatedNotes))
      setNoteToDelete(null)
    }
  }

  const cancelDelete = (): void => {
    setNoteToDelete(null)
  }

  useEffect(() => {
    const handleFileManagerAction = (event: CustomEvent): void => {
      const { action, title } = event.detail
      let noteToOpen: Note | undefined
      let noteToDelete: Note | undefined

      switch (action) {
        case 'createNote':
          handleNewNote()
          break
        case 'openNote':
          noteToOpen = notes.find(
            (note) =>
              note.title.toLowerCase() === title.toLowerCase() ||
              note.title.toLowerCase().includes(title.toLowerCase())
          )
          if (noteToOpen) {
            handleSelectNote(noteToOpen)
          } else {
            // Create a new note with the specified title if it doesn't exist
            const newNote: Note = {
              id: uuidv4(),
              title: title,
              content: ''
            }
            handleSelectNote(newNote)
          }
          break
        case 'deleteNote':
          noteToDelete = notes.find(
            (note) =>
              note.title.toLowerCase() === title.toLowerCase() ||
              note.title.toLowerCase().includes(title.toLowerCase())
          )
          if (noteToDelete) {
            setNoteToDelete(noteToDelete)
          }
          break
      }
    }

    window.addEventListener('file-manager-action', handleFileManagerAction as EventListener)
    return (): void => {
      window.removeEventListener('file-manager-action', handleFileManagerAction as EventListener)
    }
  }, [notes, handleNewNote, handleSelectNote])

  return (
    <div
      ref={windowRef}
      className={`fixed bg-yellow-100 z-20 flex flex-col rounded-lg shadow-2xl border-2 border-black transition-all duration-200 ${
        isExpanded ? 'inset-4' : 'w-1/2 h-2/3'
      }`}
      style={{
        transform: isExpanded ? 'none' : `translate(${position.x}px, ${position.y}px)`,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="window-header flex justify-between items-center p-2 bg-yellow-500 border-b-2 border-black rounded-t-lg cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-2">
          <Folder className="w-6 h-6 text-black" />
          <h2 className="text-2xl font-bold text-black">Note Manager</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-black hover:text-yellow-200 transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
          <button onClick={onClose} className="text-black hover:text-red-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-4">
        <div className="bg-yellow-300 border-2 border-black rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Your Notes</h3>
            <button
              onClick={handleNewNote}
              className="bg-yellow-400 hover:bg-yellow-500 text-black px-3 py-1 rounded-lg border-2 border-black flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Note
            </button>
          </div>

          {notes.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg border-2 border-black">
              <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600">No notes found. Create your first note!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="bg-white rounded-lg border-2 border-black p-4 hover:bg-yellow-200 cursor-pointer transition-colors group relative min-h-[120px]"
                  onClick={() => handleSelectNote(note)}
                >
                  <div className="flex items-start gap-3 h-full">
                    <FileText className="w-6 h-6 text-yellow-500 group-hover:text-yellow-600 flex-shrink-0" />
                    <div className="flex-grow min-w-0">
                      <h4 className="font-bold text-lg mb-1 group-hover:text-yellow-800 truncate">
                        {note.title}
                      </h4>
                      <p className="text-gray-600 text-sm line-clamp-2 break-words">
                        {note.content}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteNote(note, e)}
                      className="absolute top-2 right-2 p-1 rounded-full hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
      {noteToDelete && (
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

export default FileManager
