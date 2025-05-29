import React, { useState, useEffect, useRef } from 'react'
import { X, Minimize2, Maximize2 } from 'lucide-react'

interface Photo {
  id: string
  url: string
  timestamp: number
}

interface PhotoGalleryProps {
  onClose: () => void
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({ onClose }): JSX.Element => {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const windowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const savedPhotos = localStorage.getItem('bee-camera-photos')
    if (savedPhotos) {
      try {
        const parsedPhotos = JSON.parse(savedPhotos)
        const validPhotos = parsedPhotos
          .filter((photo: Photo) => Boolean(photo.url))
          .sort((a: Photo, b: Photo) => b.timestamp - a.timestamp)
        setPhotos(validPhotos)
        if (validPhotos.length !== parsedPhotos.length) {
          localStorage.setItem('bee-camera-photos', JSON.stringify(validPhotos))
        }
      } catch (err) {
        console.error('Failed to parse saved photos:', err)
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
    return (): void => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  const deletePhoto = (photoId: string): void => {
    const updatedPhotos = photos.filter((photo) => photo.id !== photoId)
    setPhotos(updatedPhotos)
    localStorage.setItem('bee-camera-photos', JSON.stringify(updatedPhotos))
    setSelectedPhoto(null)
  }

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
          <h2 className="text-2xl font-bold text-black">Photo Gallery</h2>
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
        {photos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No photos yet. Take some photos with the camera!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <img
                key={photo.id}
                className="relative group cursor-pointer w-full h-48 object-cover rounded-lg border-2 border-black"
                src={photo.url}
                alt={`Photo taken at ${new Date(photo.timestamp).toLocaleString()}`}
                onClick={() => setSelectedPhoto(photo)}
                onError={(e) => {
                  console.error('Failed to load image:', photo.url)
                  e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Failed+to+load'
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Photo Preview Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="relative">
              <img
                src={selectedPhoto.url}
                alt={`Photo taken at ${new Date(selectedPhoto.timestamp).toLocaleString()}`}
                className="w-full h-auto rounded-lg"
              />
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={() => deletePhoto(selectedPhoto.id)}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PhotoGallery
