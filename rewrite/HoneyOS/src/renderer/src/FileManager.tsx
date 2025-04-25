import { useState, useEffect } from 'react'

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

  useEffect(() => {
    const storedNotes = localStorage.getItem('bee-notepad-notes')
    console.log('Stored notes:', storedNotes)
    if (storedNotes) {
      try {
        const parsed = JSON.parse(storedNotes)
        setNotes(parsed)
      } catch (err) {
        console.error('Failed to parse notes:', err)
      }
    }
  }, [])

  const handleSelectNote = (note: Note) => {
    onNoteSelect(note)
    onClose() // Optionally auto-close FileManager after selection
  }

  return (
    <div className="absolute inset-0 bg-yellow-100 z-20 p-4 overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Your Notes</h2>
        <button onClick={onClose} className="text-xl hover:text-red-600">
          ✕
        </button>
      </div>
      {notes.length === 0 ? (
        <p>No notes found.</p>
      ) : (
        <ul className="space-y-4">
          {notes.map((note) => (
            <li
              key={note.id}
              className="p-4 bg-white rounded shadow border cursor-pointer hover:bg-yellow-200"
              onClick={() => handleSelectNote(note)}
            >
              <strong>{note.title}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default FileManager
