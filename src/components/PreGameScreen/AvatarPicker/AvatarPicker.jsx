import React from "react";
import "./AvatarPicker.css";
import { AVATAR_MAP } from "../../generalMaps";

export default function AvatarPicker({
  isOpen,
  onClose,
  onSelect,
  ids,
  selectedId,
  title = "Choose your avatar",
}) {  
  if (!isOpen) return null;

  const handleBackdrop = (e) => {
    e.stopPropagation();
    onClose?.();
  };

  return (
    <div className="ap-overlay" onClick={handleBackdrop} aria-hidden>
      <div
        className="ap-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ap-head">
          <h3 className="ap-title">{title}</h3>
          <button
            type="button"
            className="ap-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="ap-grid">
          {ids.map((id) => (
            <button
              key={id}
              type="button"
              className="ap-avatarBtn"
              data-selected={selectedId === id ? "true" : "false"}
              onClick={() => {
                onSelect?.(id);
                onClose?.();
              }}
              aria-label={`Select avatar`}
            >
              <img className="ap-avatarImg" src={AVATAR_MAP[id]} alt="" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
