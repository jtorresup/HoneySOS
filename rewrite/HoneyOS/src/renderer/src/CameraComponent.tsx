import React, { useRef, useEffect, useState } from 'react'

interface CameraComponentProps {
  onClose: () => void
}

const CameraComponent: React.FC<CameraComponentProps> = ({ onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const photoRef = useRef<HTMLCanvasElement>(null)
  const [hasPhoto, setHasPhoto] = useState(false)

  const getVideo = (): void => {
    navigator.mediaDevices
      .getUserMedia({
        video: { width: { ideal: window.innerWidth }, height: { ideal: window.innerHeight } }
      })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
      })
      .catch((err) => {
        console.error('Error getting video stream:', err)
      })
  }

  const takePhoto = (): void => {
    const width = videoRef.current?.videoWidth || 720
    const height = videoRef.current?.videoHeight || 480

    if (photoRef.current && videoRef.current) {
      const context = photoRef.current.getContext('2d')
      if (context) {
        photoRef.current.width = width
        photoRef.current.height = height

        context.drawImage(videoRef.current, 0, 0, width, height)

        const imageData = photoRef.current.toDataURL('image/png')

        setHasPhoto(true)
      }
    }
  }

  const closePhoto = (): void => {
    setHasPhoto(false)
    getVideo() // Restart video stream
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

  return (
    <div className="absolute inset-0 bg-black flex items-center justify-center z-30">
      <div className="relative w-full h-full flex items-center justify-center">
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover ${hasPhoto ? 'hidden' : ''}`}
        ></video>
        <canvas
          ref={photoRef}
          className={`absolute inset-0 w-full h-full object-contain ${hasPhoto ? '' : 'hidden'}`}
        ></canvas>

        {hasPhoto ? (
          // Only show 'Take Another Photo' and 'Close' buttons after taking a photo
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
            <button onClick={closePhoto} className="bg-blue-500 text-white px-4 py-2 rounded">
              Take Another Photo
            </button>
          </div>
        ) : (
          <button
            onClick={takePhoto}
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded"
          >
            Take Photo
          </button>
        )}

        <button onClick={onClose} className="absolute top-4 right-4 text-white text-2xl z-10">
          ✕
        </button>
      </div>
    </div>
  )
}

export default CameraComponent
