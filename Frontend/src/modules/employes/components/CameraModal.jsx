import React, { useRef, useState, useEffect } from "react";
import { X, Camera, RotateCcw, CheckCircle } from "lucide-react";

const CameraModal = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  // Start camera when modal opens
  useEffect(() => {
    if (isOpen) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setError(null);
      setCapturedImage(null);
      setIsCameraReady(false);

      // Request camera with front camera preference (selfie mode)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user", // 'user' is front camera, 'environment' is back camera
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image as data URL
      const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9);
      setCapturedImage(imageDataUrl);

      // Stop camera after capture
      stopCamera();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (capturedImage && onCapture) {
      onCapture(capturedImage);
    }
    handleClose();
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-surface rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-bold text-text-primary">Take Selfie</h3>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-background transition-colors"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Camera/Image View */}
        <div className="relative mx-auto bg-black aspect-3/4 max-h-[60vh]">
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="text-center">
                <p className="text-red-400 mb-4">{error}</p>
                <button
                  onClick={startCamera}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : capturedImage ? (
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-cover"
            />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onCanPlay={() => setIsCameraReady(true)}
              className="w-full h-full object-cover"
            />
          )}

          {/* Hidden canvas for capturing */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Overlay guide */}
          {!capturedImage && !error && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-2 border-white/30 rounded-full w-48 h-48" />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-6 bg-surface">
          {capturedImage ? (
            <div className="flex gap-3">
              <button
                onClick={handleRetake}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-background border border-border rounded-xl font-medium text-text-primary hover:bg-background/80 transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
                Retake
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                <CheckCircle className="w-5 h-5" />
                Confirm
              </button>
            </div>
          ) : (
            <button
              onClick={capturePhoto}
              disabled={!!error || !isCameraReady}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera className="w-5 h-5" />
              Capture Photo
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraModal;
