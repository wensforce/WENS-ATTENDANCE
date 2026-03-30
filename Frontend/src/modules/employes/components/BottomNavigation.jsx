import React from 'react'
import { NavLink } from 'react-router-dom'

const BottomNavigation = () => {
  return (
    <div 
        className='sticky rounded-t-lg shadow-md py-3 bottom-0 left-0 right-0 flex items-end justify-around bg-surface border-t border-border'
      >
        {/* Home */}
        <NavLink
          to="/"
          className={({ isActive }) => `flex flex-col items-center pt-3 pb-2 px-4 relative group transition-all duration-300 ease-out ${
            isActive 
              ? 'text-primary' 
              : 'text-muted'
          }`}
        >
          {({ isActive }) => (
            <>
              <div className={`transform transition-all duration-300 ease-out ${isActive ? 'scale-110' : 'scale-100 group-hover:scale-105'}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                </svg>
              </div>
              <span className={`text-xs font-semibold mt-1 transition-all duration-300 ${isActive ? 'text-primary' : 'text-muted'}`}>Home</span>
              <div 
                className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-1 bg-primary rounded-full transition-all duration-300 ${
                  isActive ? 'w-8' : 'w-0'
                }`}
              />
            </>
          )}
        </NavLink>

        {/* Attendance */}
        <NavLink
          to="/attendance"
          className={({ isActive }) => `flex flex-col items-center pt-3 pb-2 px-4 relative group transition-all duration-300 ease-out ${
            isActive 
              ? 'text-primary' 
              : 'text-muted'
          }`}
        >
          {({ isActive }) => (
            <>
              <div className={`transform transition-all duration-300 ease-out ${isActive ? 'scale-110' : 'scale-100 group-hover:scale-105'}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <span className={`text-xs font-semibold mt-1 transition-all duration-300 ${isActive ? 'text-primary' : 'text-muted'}`}>Attendance</span>
              <div 
                className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-1 bg-primary rounded-full transition-all duration-300 ${
                  isActive ? 'w-8' : 'w-0'
                }`}
              />
            </>
          )}
        </NavLink>

        {/* Profile */}
        <NavLink
          to="/profile"
          className={({ isActive }) => `flex flex-col items-center pt-3 pb-2 px-4 relative group transition-all duration-300 ease-out ${
            isActive 
              ? 'text-primary' 
              : 'text-muted'
          }`}
        >
          {({ isActive }) => (
            <>
              <div className={`transform transition-all duration-300 ease-out ${isActive ? 'scale-110' : 'scale-100 group-hover:scale-105'}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <span className={`text-xs font-semibold mt-1 transition-all duration-300 ${isActive ? 'text-primary' : 'text-muted'}`}>Profile</span>
              <div 
                className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-1 bg-primary rounded-full transition-all duration-300 ${
                  isActive ? 'w-8' : 'w-0'
                }`}
              />
            </>
          )}
        </NavLink>
      </div>
  )
}

export default BottomNavigation