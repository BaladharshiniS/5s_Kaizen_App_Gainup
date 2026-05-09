// src/components/CameraCapture.jsx
// Real-time camera capture using getUserMedia (WebRTC)
// Works on Android Chrome, iOS Safari 14.3+, Desktop Chrome/Firefox
// Falls back gracefully if camera permission is denied

import { useEffect, useRef, useState } from 'react'

const CameraCapture = ({ onCapture, onClose }) => {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [facingMode, setFacingMode] = useState('environment') // 'environment' = rear, 'user' = front

  useEffect(() => {
    startCamera(facingMode)
    return () => stopCamera()
  }, [])

  const startCamera = async (facing) => {
    stopCamera() // stop any existing stream first
    setReady(false)
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play()
          setReady(true)
        }
      }
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission denied. Please allow camera access in your browser settings and try again.')
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.')
      } else {
        setError('Unable to start camera: ' + err.message)
      }
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }

  const flipCamera = () => {
    const newFacing = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(newFacing)
    startCamera(newFacing)
  }

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !ready) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    // Flip horizontally if front camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88)
    stopCamera()
    onCapture(dataUrl)
  }

  const handleClose = () => {
    stopCamera()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: '#000' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.8)' }}>
        <button
          onClick={handleClose}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-white font-bold text-sm"
          style={{ background: 'rgba(255,255,255,0.15)' }}>
          ✕
        </button>
        <p className="text-white text-sm font-semibold">📷 Take Photo</p>
        <button
          onClick={flipCamera}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-white font-bold text-sm"
          style={{ background: 'rgba(255,255,255,0.15)' }}>
          🔄
        </button>
      </div>

      {/* Camera view or Error */}
      <div className="flex-1 relative overflow-hidden">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <span className="text-6xl mb-4">📵</span>
            <p className="text-white font-black text-lg mb-2">Camera Not Available</p>
            <p className="text-gray-400 text-sm mb-8 max-w-xs">{error}</p>
            <button
              onClick={handleClose}
              className="bg-white text-gray-900 font-bold py-3 px-10 rounded-2xl text-sm">
              Use Gallery Instead
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
            />
            {!ready && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-white text-sm">Starting camera...</p>
              </div>
            )}
            {/* Viewfinder corners */}
            {ready && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-white opacity-60 rounded-tl-lg" />
                <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-white opacity-60 rounded-tr-lg" />
                <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-white opacity-60 rounded-bl-lg" />
                <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-white opacity-60 rounded-br-lg" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Shutter button */}
      {!error && (
        <div className="flex items-center justify-center py-8 flex-shrink-0"
          style={{ background: 'rgba(0,0,0,0.8)' }}>
          <button
            onClick={takePhoto}
            disabled={!ready}
            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-transform active:scale-95"
            style={{
              background: 'transparent',
              opacity: ready ? 1 : 0.4
            }}>
            <div className="w-14 h-14 rounded-full bg-white" />
          </button>
        </div>
      )}
    </div>
  )
}

export default CameraCapture
