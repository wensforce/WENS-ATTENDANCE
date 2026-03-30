import { FingerprintPattern } from 'lucide-react'
import React from 'react'

const CheckInButton = ({
    handleCheckInClick,
    isCheckedIn
}) => {
  return (
     <div className="flex flex-col items-center mb-8">
        <div
          onClick={handleCheckInClick}
          className="w-40 h-40 rounded-full flex flex-col bg-primary items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95"
          style={{
            boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
          }}
        >
          {/* Fingerprint Icon */}
          <FingerprintPattern
            strokeWidth={1}
            className="w-12 h-12 text-primary-foreground/80 mb-2"
          />
          <span className="text-lg font-bold tracking-wider text-primary-foreground/90">
              {isCheckedIn ? "CHECK OUT" : "CHECK IN"}
          </span>
        </div>
      </div>
  )
}

export default CheckInButton