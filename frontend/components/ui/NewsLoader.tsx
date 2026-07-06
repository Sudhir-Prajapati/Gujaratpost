export default function NewsLoader({ fullPage = false }: { fullPage?: boolean }) {
  return (
    <div className={`news-loader ${fullPage ? 'news-loader-page' : ''}`} role="status" aria-live="polite" aria-label="Loading Gujarat Post">
      <div className="news-loader-stage" aria-hidden="true">
        {/* 3D Radio signal waves radiating from the head */}
        <div className="news-loader-rings">
          <span />
          <span />
          <span />
        </div>
        
        {/* The 3D Microphone container */}
        <div className="news-loader-mic-3d">
          {/* Metallic mesh mic head */}
          <div className="news-loader-mic-head-3d">
            <div className="mesh-pattern" />
            <div className="head-shine" />
            <div className="head-band" />
          </div>
          
          {/* 3D Mic Neck */}
          <div className="news-loader-mic-neck-3d">
            <div className="neck-face front" />
            <div className="neck-face right" />
            <div className="neck-face back" />
            <div className="neck-face left" />
          </div>
          
          {/* 3D Cube Mic Flag */}
          <div className="news-loader-mic-flag-3d">
            <div className="flag-face front">
              <b>GP</b>
              <small>NEWS</small>
            </div>
            <div className="flag-face back">
              <b>GP</b>
              <small>NEWS</small>
            </div>
            <div className="flag-face left">
              <b>ગુજરાત</b>
              <small>પોસ્ટ</small>
            </div>
            <div className="flag-face right">
              <b>ગુજરાત</b>
              <small>પોસ્ટ</small>
            </div>
            <div className="flag-face top" />
            <div className="flag-face bottom" />
          </div>
          
          {/* 3D Mic Handle */}
          <div className="news-loader-mic-handle-3d">
            <div className="handle-face front" />
            <div className="handle-face right" />
            <div className="handle-face back" />
            <div className="handle-face left" />
          </div>
          
          {/* 3D Mic Base */}
          <div className="news-loader-mic-base-3d" />
        </div>

        {/* 3D Orbiting Satellite */}
        <div className="news-loader-orbit-3d">
          <div className="orbiting-satellite">
            <span>LIVE</span>
          </div>
        </div>
      </div>
      
      <div className="news-loader-copy">
        <strong>Gujarat Post</strong>
        <span>Bringing the story to you</span>
      </div>
      <div className="news-loader-bar">
        <span />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

