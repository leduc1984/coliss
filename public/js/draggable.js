function makeDraggable(element, options) {
    const handle = options?.handle || element;
    let isDragging = false;
    let offset = { x: 0, y: 0 };

    const onMouseDown = (e) => {
        isDragging = true;
        const rect = element.getBoundingClientRect();
        offset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
        e.preventDefault();
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    const onMouseUp = () => {
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    };

    const onMouseMove = (e) => {
        if (!isDragging) return;
        const newX = e.clientX - offset.x;
        const newY = e.clientY - offset.y;
        element.style.left = `${newX}px`;
        element.style.top = `${newY}px`;
    };

    handle.addEventListener('mousedown', onMouseDown);
    handle.style.cursor = 'grab';
}
