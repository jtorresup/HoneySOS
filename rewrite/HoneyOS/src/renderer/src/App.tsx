import { useState, useEffect } from 'react'
import honeyBackground from './assets/honeycomb-background.png'
import folderIcon from './assets/folder.png'
import notepadIcon from './assets/notepad.png'

function App(): JSX.Element {
  const [time, setTime] = useState(new Date())
  const [isFolderHover, setIsFolderHover] = useState(false)
  const [isNotepadHover, setIsNotepadHover] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Format time as HH:MM AM/PM
  const formatTime = () => {
    let hours = time.getHours()
    const minutes = time.getMinutes()
    const ampm = hours >= 12 ? 'PM' : 'AM'

    hours = hours % 12
    hours = hours ? hours : 12 // the hour '0' should be '12'

    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes

    return `${hours}:${formattedMinutes}`
  }

  // Format date as Month Day, Year
  const formatDate = (): string => {
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: 'numeric',
      year: 'numeric' as const
    }
    return time.toLocaleDateString('en-US', options)
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-amber-500 salsa-regular">
      {/* Honeycomb background pattern */}
      <div
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{
          backgroundImage: `url(${honeyBackground})`,
          backgroundSize: 'cover'
        }}
      >
        {/* Time and date display */}
        <div className="flex flex-col items-center justify-center absolute top-1/4 left-1/2 transform -translate-x-1/2">
          <h1 className="text-white text-8xl font-bold tracking-tight drop-shadow-lg">
            {formatTime()}
            <span className="text-5xl">AM</span>
          </h1>
          <p className="text-white text-3xl mt-2 font-light tracking-wide">{formatDate()}</p>
        </div>

        {/* Desktop icons */}

        <div
          className="flex flex-col items-center justify-center cursor-pointer absolute z-10 bottom-34 left-40 rounded-full hover:bg-black/20 transition-all duration-300 w-32 h-32"
          onMouseEnter={() => setIsFolderHover(true)}
          onMouseLeave={() => setIsFolderHover(false)}
        >
          <img
            src={folderIcon}
            alt="Folder"
            className={`w-12 h-12 ${isFolderHover ? 'scale-110' : ''} transition-all duration-300`}
          />
        </div>
        <div
          className="flex flex-col items-center justify-center cursor-pointer absolute z-10 left-70 bottom-10 rounded-full hover:bg-black/20 transition-all duration-300 w-32 h-32"
          onMouseEnter={() => setIsNotepadHover(true)}
          onMouseLeave={() => setIsNotepadHover(false)}
        >
          <img
            src={notepadIcon}
            alt="Notepad"
            className={`w-12 h-12 ${isNotepadHover ? 'scale-110' : ''} transition-all duration-300`}
          />
        </div>
      </div>
    </div>
  )
}

export default App
