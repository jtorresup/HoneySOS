import React, { useRef, useEffect, useState } from 'react'
import { Minimize2, Maximize2 } from 'lucide-react'
import axios from 'axios'

interface CameraComponentProps {
  onClose: () => void
}

interface Photo {
  id: string
  url: string
  timestamp: number
}

const CLOUDINARY_UPLOAD_PRESET = 'b5dth0em' // Replace with your Cloudinary upload preset
const CLOUDINARY_CLOUD_NAME = 'dm8ndcycu' // Replace with your Cloudinary cloud name

const CameraComponent: React.FC<CameraComponentProps> = ({ onClose }): JSX.Element => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const photoRef = useRef<HTMLCanvasElement>(null)
  const windowRef = useRef<HTMLDivElement>(null)
  const [hasPhoto, setHasPhoto] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isUploading, setIsUploading] = useState(false)
  const [photos, setPhotos] = useState<Photo[]>([])

  useEffect(() => {
    // Load saved photos from localStorage
    const savedPhotos = localStorage.getItem('bee-camera-photos')
    if (savedPhotos) {
      try {
        setPhotos(JSON.parse(savedPhotos))
      } catch (err) {
        console.error('Failed to parse saved photos:', err)
      }
    }
  }, [])

  const getVideo = async (): Promise<void> => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter((device) => device.kind === 'videoinput')

      // Prefer the first non-OBS camera
      const preferredDevice =
        videoDevices.find((device) => !device.label.toLowerCase().includes('obs')) ||
        videoDevices[0]

      if (!preferredDevice) {
        console.error('No video input devices found.')
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: preferredDevice.deviceId }
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }

      console.log('🎥 Using device:', preferredDevice.label)
    } catch (err) {
      console.error('Error accessing camera:', err)
    }
  }

  const uploadToCloudinary = async (base64Image: string): Promise<string> => {
    try {
      const base64Data = base64Image.split(',')[1] // Remove the data URL prefix
      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }

      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'image/jpeg' })

      // Prepare form data
      const formData = new FormData()
      formData.append('file', blob, 'photo.jpg')
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)

      // Send POST request with FormData
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      if (response.status !== 200) {
        throw new Error(response.data.error?.message || 'Upload failed')
      }

      return response.data.secure_url
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error)
      throw error
    }
  }

  const takePhoto = async (): Promise<void> => {
    const width = videoRef.current?.videoWidth || 720
    const height = videoRef.current?.videoHeight || 480

    if (photoRef.current && videoRef.current) {
      const context = photoRef.current.getContext('2d')
      if (context) {
        photoRef.current.width = width
        photoRef.current.height = height
        context.drawImage(videoRef.current, 0, 0, width, height)
        setHasPhoto(true)
        setIsUploading(true)

        try {
          // Convert canvas to base64
          const base64Image = photoRef.current.toDataURL('image/jpeg')

          // Upload to Cloudinary
          const imageUrl = await uploadToCloudinary(base64Image)

          // Create new photo object
          const newPhoto: Photo = {
            id: crypto.randomUUID(),
            url: imageUrl,
            timestamp: Date.now()
          }

          // Update photos state and localStorage
          const updatedPhotos = [newPhoto, ...photos]
          setPhotos(updatedPhotos)
          localStorage.setItem('bee-camera-photos', JSON.stringify(updatedPhotos))
        } catch (error) {
          console.error('Failed to save photo:', error)
        } finally {
          setIsUploading(false)
        }
      }
    }
  }

  const closePhoto = (): void => {
    setHasPhoto(false)
    getVideo() // Restart video stream
  }

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
    getVideo()
    return (): void => {
      // Stop video stream when component unmounts
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        const tracks = stream.getTracks()
        tracks.forEach((track) => track.stop())
      }
    }
  }, [])

  useEffect(() => {
    const handleCameraAction = (event: CustomEvent): void => {
      const { action } = event.detail
      switch (action) {
        case 'takePhoto':
          if (!hasPhoto && !isUploading) {
            takePhoto()
          }
          break
        case 'retakePhoto':
          if (hasPhoto && !isUploading) {
            closePhoto()
          }
          break
      }
    }

    window.addEventListener('camera-action', handleCameraAction as EventListener)
    return () => {
      window.removeEventListener('camera-action', handleCameraAction as EventListener)
    }
  }, [hasPhoto, isUploading])

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

  return (
    <div
      ref={windowRef}
      className={`fixed bg-black z-30 flex flex-col rounded-lg shadow-2xl border-2 border-yellow-500 transition-all duration-200 ${
        isExpanded ? 'inset-4' : 'w-1/2 h-2/3'
      }`}
      style={{
        transform: isExpanded ? 'none' : `translate(${position.x}px, ${position.y}px)`,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="window-header flex items-center justify-between p-2 bg-yellow-500 border-b-2 border-black relative rounded-t-lg cursor-grab active:cursor-grabbing">
        <span className="font-bold text-2xl text-black">Camera</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-black hover:text-yellow-200"
          >
            {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
          <button onClick={onClose} className="text-xl hover:text-red-600">
            ✕
          </button>
        </div>
      </div>

      <div className="relative flex-grow flex items-center justify-center bg-black overflow-hidden">
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover ${hasPhoto ? 'hidden' : ''}`}
          autoPlay
          playsInline
        ></video>
        <canvas
          ref={photoRef}
          className={`absolute inset-0 w-full h-full object-contain ${hasPhoto ? '' : 'hidden'}`}
          style={{ maxWidth: '100%', maxHeight: '100%' }}
        ></canvas>

        {hasPhoto ? (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4 z-10">
            <button
              onClick={closePhoto}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Take Another Photo'}
            </button>
          </div>
        ) : (
          <button
            onClick={takePhoto}
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors z-10"
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Take Photo'}
          </button>
        )}
      </div>
    </div>
  )
}

export default CameraComponent
