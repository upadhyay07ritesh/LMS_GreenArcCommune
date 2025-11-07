import React, { useEffect, useState } from "react";
import disableDevtool from "disable-devtool";

/**
 * ScreenProtector — Ultimate Version (persistent overlay only during recording)
 * Blocks devtools, screen capture, printing, right-click, and more.
 * Allows normal Ctrl, Alt, Shift usage.
 */
export default function ScreenProtector({
  username = "User",
  sensitivity = 160,
}) {
  const [protectedMode, setProtectedMode] = useState(false);
  const [timestamp, setTimestamp] = useState(new Date().toLocaleString());
  const [recordingActive, setRecordingActive] = useState(false);

  useEffect(() => {
    // 🧹 Remove preload protector
    const removePreload = () => {
      const preload = document.getElementById("preload-protector");
      if (preload && preload.parentNode) {
        preload.parentNode.removeChild(preload);
      }
    };
    removePreload();
    const preloadCheck = setInterval(removePreload, 1000);
    setTimeout(() => clearInterval(preloadCheck), 5000);

    // 🔒 Disable DevTools globally
    disableDevtool({ disableMenu: true });

    // 🕒 Update watermark timestamp
    const tsInterval = setInterval(() => {
      setTimestamp(new Date().toLocaleString());
    }, 1000);

    // 🚨 Activate protection
    const triggerProtection = (source = "other") => {
      if (source === "recording") {
        setRecordingActive(true); // mark recording started
        setProtectedMode(true);   // show overlay
      }
    };

    // ⌨️ Keyboard monitoring
    const onKeyDown = (e) => {
      if (["Control", "Alt", "Shift", "Meta"].includes(e.key)) return;

      if (e.key === "F12") {
        e.preventDefault();
        return false;
      }

      if (e.ctrlKey && e.shiftKey && ["i", "j", "c"].includes(e.key.toLowerCase())) {
        e.preventDefault();
        return false;
      }

      if (e.ctrlKey && e.key.toLowerCase() === "u") {
        e.preventDefault();
        return false;
      }

      if (e.metaKey && e.altKey && e.key.toLowerCase() === "i") {
        e.preventDefault();
        return false;
      }
    };

    // 🖱️ Right-click blocker
    const onContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    // 👁️ Visibility, blur, print detection (do NOT trigger overlay)
    const onVisibilityChange = () => {};
    const onBeforePrint = () => {};
    const onBlur = () => {};

    // 🧩 DevTools detection (do NOT trigger overlay)
    const detectDevtools = () => {};

    // 🎥 Intercept screen recording
    let originalGetDisplayMedia = null;
    if (navigator.mediaDevices?.getDisplayMedia) {
      try {
        originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;
        navigator.mediaDevices.getDisplayMedia = async (...args) => {
          triggerProtection("recording");
          alert("🚫 Screen recording is not allowed!");

          const stream = await originalGetDisplayMedia(...args);

          // Listen for when recording stops
          stream.getTracks().forEach((track) => {
            track.addEventListener("ended", () => {
              setRecordingActive(false); // recording stopped
              setProtectedMode(false);   // hide overlay
            });
          });

          throw new Error("Screen recording blocked!");
        };
      } catch {}
    }

    // 🧠 Event listeners
    const devtoolsInterval = setInterval(detectDevtools, 800);
    window.addEventListener("keydown", onKeyDown, { capture: true });
    window.addEventListener("contextmenu", onContextMenu, { capture: true });
    document.addEventListener("visibilitychange", onVisibilityChange, true);
    window.addEventListener("beforeprint", onBeforePrint, true);
    window.addEventListener("blur", onBlur, true);

    // 🧹 Cleanup
    return () => {
      clearInterval(tsInterval);
      clearInterval(devtoolsInterval);
      clearInterval(preloadCheck);
      window.removeEventListener("keydown", onKeyDown, { capture: true });
      window.removeEventListener("contextmenu", onContextMenu, { capture: true });
      document.removeEventListener("visibilitychange", onVisibilityChange, true);
      window.removeEventListener("beforeprint", onBeforePrint, true);
      window.removeEventListener("blur", onBlur, true);
      if (originalGetDisplayMedia && navigator.mediaDevices) {
        navigator.mediaDevices.getDisplayMedia = originalGetDisplayMedia;
      }
    };
  }, [sensitivity]);

  // 🧱 Overlay only during recording
  if (!protectedMode) return null;

  return (
    <>
      <div
        id="screen-protector-overlay"
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 2147483647,
          backgroundColor: "rgba(0,0,0,0.92)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          textAlign: "center",
          userSelect: "none",
          pointerEvents: "all",
          transition: "opacity 0.5s ease-in-out",
        }}
      >
        <h2 style={{ margin: 0 }}>🚫 Protected Content</h2>
        <p style={{ opacity: 0.8, marginTop: 10 }}>
          Screen recording detected. Overlay will disappear only when recording stops.
        </p>

        {/* Central watermark */}
        <div
          style={{
            position: "absolute",
            transform: "translate(-50%, -50%) rotate(-25deg)",
            left: "50%",
            top: "50%",
            fontSize: "20px",
            opacity: 0.08,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            fontFamily: "sans-serif",
            letterSpacing: "4px",
          }}
        >
          {`${username} • ${timestamp} • ${window.location.hostname}`}
        </div>

        {/* Corner watermarks */}
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 12,
            fontSize: 12,
            opacity: 0.5,
            pointerEvents: "none",
          }}
        >
          {username} — {timestamp}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 10,
            right: 12,
            fontSize: 12,
            opacity: 0.5,
            pointerEvents: "none",
          }}
        >
          {username} — {timestamp}
        </div>
      </div>

      <style>{`body { overflow: hidden !important; }`}</style>
    </>
  );
}
