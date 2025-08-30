import React, { useState, useRef, useEffect, useCallback } from 'react';

const Draggable = ({ children, initialPosition = { x: 0, y: 0 } }) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const draggableRef = useRef(null);
  const offset = useRef({ x: 0, y: 0 });

  const onMouseDown = useCallback((e) => {
    const target = e.target;
    if (target.closest('[data-drag-handle="true"]') && draggableRef.current) {
      setIsDragging(true);
      const rect = draggableRef.current.getBoundingClientRect();
      offset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      e.preventDefault();
    }
  }, []);

  const onMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.userSelect = '';
  }, []);

  const onMouseMove = useCallback((e) => {
    if (isDragging) {
        document.body.style.userSelect = 'none';
        const newX = e.clientX - offset.current.x;
        const newY = e.clientY - offset.current.y;
        setPosition({ x: newX, y: newY });
    }
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, onMouseMove, onMouseUp]);

  return (
    <div
      ref={draggableRef}
      style={{
        position: 'absolute',
        top: `${position.y}px`,
        left: `${position.x}px`,
        touchAction: 'none'
      }}
      onMouseDown={onMouseDown}
    >
      {children}
    </div>
  );
};

export default Draggable;