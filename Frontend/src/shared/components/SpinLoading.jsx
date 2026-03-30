import React from 'react'

const SpinLoading = () => {
  return (
    <>
      <style>{`
        @keyframes sl-orbit1 {
          from { transform: rotateZ(0deg) rotateX(70deg) rotateZ(0deg); }
          to   { transform: rotateZ(360deg) rotateX(70deg) rotateZ(-360deg); }
        }
        @keyframes sl-orbit2 {
          from { transform: rotateZ(0deg) rotateX(65deg) rotateZ(0deg); }
          to   { transform: rotateZ(-360deg) rotateX(65deg) rotateZ(360deg); }
        }
        @keyframes sl-orbit3 {
          from { transform: rotateZ(55deg) rotateX(72deg) rotateZ(0deg); }
          to   { transform: rotateZ(55deg) rotateX(72deg) rotateZ(-360deg); }
        }
        @keyframes sl-pulse-core {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            box-shadow:
              0 0 0 0 rgba(17,24,39,0.6),
              0 0 20px rgba(17,24,39,0.8),
              0 0 50px rgba(17,24,39,0.3);
          }
          50% {
            transform: translate(-50%, -50%) scale(1.18);
            box-shadow:
              0 0 0 22px rgba(17,24,39,0),
              0 0 40px rgba(17,24,39,0.9),
              0 0 90px rgba(107,114,128,0.4);
          }
        }
        @keyframes sl-ripple {
          0%   { transform: translate(-50%, -50%) scale(0.4); opacity: 0.7; }
          100% { transform: translate(-50%, -50%) scale(3.5); opacity: 0; }
        }
        @keyframes sl-shimmer {
          0%   { background-position: -300% center; }
          100% { background-position: 300% center; }
        }
        @keyframes sl-dot-bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
          40%            { transform: scale(1.3); opacity: 1; }
        }
        @keyframes sl-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        @keyframes sl-glow-ring {
          0%, 100% { opacity: 0.18; }
          50%       { opacity: 0.45; }
        }
      `}</style>

      {/* ── Backdrop ── */}
      <div style={{
        position: 'fixed',
        inset: 0,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        backgroundColor: 'rgba(249, 250, 251, 0.75)',
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '44px',
      }}>

        {/* ── Soft ambient glow behind the orb ── */}
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'sl-float 3.5s ease-in-out infinite',
        }}>
          <div style={{
            position: 'absolute',
            width: '240px',
            height: '240px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(17,24,39,0.12) 0%, rgba(107,114,128,0.06) 50%, transparent 70%)',
            filter: 'blur(20px)',
            animation: 'sl-glow-ring 2.5s ease-in-out infinite',
          }} />

          {/* ── 3-D orbital scene ── */}
          <div style={{
            position: 'relative',
            width: '190px',
            height: '190px',
            transformStyle: 'preserve-3d',
            perspective: '700px',
          }}>

            {/* Ripple waves */}
            {[0, 0.7, 1.4].map((delay, i) => (
              <div key={i} style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                border: '1.5px solid rgba(17,24,39,0.5)',
                animation: `sl-ripple 2.6s ${delay}s ease-out infinite`,
              }} />
            ))}

            {/* ── Orbit ring 1 — primary black ── */}
            <div style={{
              position: 'absolute',
              inset: '8px',
              borderRadius: '50%',
              border: '1.5px solid rgba(17,24,39,0.20)',
              transformStyle: 'preserve-3d',
              animation: 'sl-orbit1 3.6s linear infinite',
            }}>
              <div style={{
                position: 'absolute',
                top: '-9px',
                left: 'calc(50% - 9px)',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #ffffff, #111827)',
                boxShadow:
                  '0 0 6px rgba(17,24,39,0.6), 0 0 18px rgba(17,24,39,0.35), 0 0 40px rgba(17,24,39,0.15)',
              }} />
            </div>

            {/* ── Orbit ring 2 — text-secondary gray ── */}
            <div style={{
              position: 'absolute',
              inset: '25px',
              borderRadius: '50%',
              border: '1.5px solid rgba(107,114,128,0.25)',
              transformStyle: 'preserve-3d',
              animation: 'sl-orbit2 2.4s linear infinite',
            }}>
              <div style={{
                position: 'absolute',
                top: '-8px',
                left: 'calc(50% - 8px)',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #ffffff, #6b7280)',
                boxShadow:
                  '0 0 6px rgba(107,114,128,0.7), 0 0 18px rgba(107,114,128,0.4), 0 0 40px rgba(107,114,128,0.2)',
              }} />
            </div>

            {/* ── Orbit ring 3 — muted gray (outer) ── */}
            <div style={{
              position: 'absolute',
              inset: '-8px',
              borderRadius: '50%',
              border: '1.5px solid rgba(156,163,175,0.22)',
              transformStyle: 'preserve-3d',
              animation: 'sl-orbit3 4.8s linear infinite',
            }}>
              <div style={{
                position: 'absolute',
                top: '-7px',
                left: 'calc(50% - 7px)',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #ffffff, #9ca3af)',
                boxShadow:
                  '0 0 6px rgba(156,163,175,0.7), 0 0 16px rgba(156,163,175,0.4), 0 0 36px rgba(156,163,175,0.2)',
              }} />
            </div>

            {/* ── Pulsing core ── */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background:
                'radial-gradient(circle at 35% 35%, #ffffff 0%, #374151 55%, #111827 100%)',
              animation: 'sl-pulse-core 2.2s ease-in-out infinite',
            }} />
          </div>
        </div>

        {/* ── Text ── */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
        }}>
          <span style={{
            background:
              'linear-gradient(90deg, #111827 0%, #6b7280 35%, #9ca3af 60%, #111827 100%)',
            backgroundSize: '300% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontSize: '13px',
            fontWeight: '700',
            letterSpacing: '6px',
            textTransform: 'uppercase',
            animation: 'sl-shimmer 3s linear infinite',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          }}>
            Loading
          </span>

          {/* Bouncing dots */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {[
              { delay: 0,    color: '#111827' },
              { delay: 0.18, color: '#6b7280' },
              { delay: 0.36, color: '#9ca3af' },
            ].map(({ delay, color }, i) => (
              <span key={i} style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: color,
                display: 'inline-block',
                boxShadow: `0 0 6px ${color}88`,
                animation: `sl-dot-bounce 1.1s ${delay}s ease-in-out infinite`,
              }} />
            ))}
          </div>
        </div>

      </div>
    </>
  )
}

export default SpinLoading