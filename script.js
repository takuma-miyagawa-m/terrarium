// ========== Initialize Draggable Elements ==========
// Get all draggable plant and animal elements
let selectedElement = null;  // Track selected element for keyboard control
const statusElement = document.getElementById('status');

function updateStatus(message) {
    if (statusElement) {
        statusElement.textContent = message;
    }
}

const draggableIds = [
    ...Array.from({ length: 14 }, (_, i) => `plant${i + 1}`),
    ...Array.from({ length: 7 }, (_, i) => `animal${i + 1}`)
];

draggableIds.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
        makeElementDraggable(element);
        // Ensure element is positioned at center of parent
        const parentRect = element.parentElement.getBoundingClientRect();
        const elemRect = element.getBoundingClientRect();
        
        // Set initial position to center if not already set
        if (!element.style.top || !element.style.left) {
            element.style.position = 'absolute';
            element.style.top = '50%';
            element.style.left = '50%';
            element.style.transform = 'translate(-50%, -50%)';
        }
    }
});

// ========== Keyboard Controls ==========
document.addEventListener('keydown', (e) => {
    if (!selectedElement) return;
    
    const transform = selectedElement.style.transform;
    let scale = 1, rotation = 0;
    
    const scaleMatch = transform.match(/scale\(([\d.]+)\)/);
    const rotateMatch = transform.match(/rotate\(([\d.-]+)deg\)/);
    
    if (scaleMatch) scale = parseFloat(scaleMatch[1]);
    if (rotateMatch) rotation = parseFloat(rotateMatch[1]);
    
    switch(e.key) {
        case 'ArrowUp':
            e.preventDefault();
            scale = Math.min(3, scale + 0.1);
            break;
        case 'ArrowDown':
            e.preventDefault();
            scale = Math.max(0.3, scale - 0.1);
            break;
        case 'ArrowLeft':
            e.preventDefault();
            rotation = (rotation - 15 + 360) % 360;
            break;
        case 'ArrowRight':
            e.preventDefault();
            rotation = (rotation + 15) % 360;
            break;
        default:
            return;
    }
    
    selectedElement.style.transform = `scale(${scale}) rotate(${rotation}deg)`;
});

// ========== Draggable Function ==========
function makeElementDraggable(element) {
    let currentX = 0;   // Current mouse/touch X position
    let currentY = 0;   // Current mouse/touch Y position
    let initialScale = 1;
    let initialRotation = 0;

    // Initialize transform values
    let scale = 1;
    let rotation = 0;

    // ========== Touch Gesture Handlers ==========
    let touchStartDistance = 0;
    let touchStartAngle = 0;

    function getDistance(p1, p2) {
        const dx = p1.clientX - p2.clientX;
        const dy = p1.clientY - p2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function getAngle(p1, p2) {
        const dx = p2.clientX - p1.clientX;
        const dy = p2.clientY - p1.clientY;
        return Math.atan2(dy, dx) * (180 / Math.PI);
    }

    element.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            // Single touch - start drag
            selectedElement = element;
            handlePointerDown(e.touches[0]);
        } else if (e.touches.length === 2) {
            // Two-finger gesture
            e.preventDefault();
            selectedElement = element;
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            touchStartDistance = getDistance(t1, t2);
            touchStartAngle = getAngle(t1, t2);
            initialScale = scale;
            initialRotation = rotation;
        }
    });

    element.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1) {
            // Single touch - drag
            handlePointerMove(e.touches[0]);
        } else if (e.touches.length === 2) {
            // Two-finger gesture - pinch and rotate
            e.preventDefault();
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            const currentDistance = getDistance(t1, t2);
            const currentAngle = getAngle(t1, t2);

            // Pinch to zoom
            const distanceRatio = currentDistance / touchStartDistance;
            scale = Math.max(0.3, Math.min(3, initialScale * distanceRatio));

            // Two-finger rotate
            const angleDifference = currentAngle - touchStartAngle;
            rotation = (initialRotation + angleDifference + 360) % 360;

            updateTransform();
        }
    });

    element.addEventListener('touchend', (e) => {
        if (e.touches.length < 2) {
            // Reset touch gesture state
            touchStartDistance = 0;
            touchStartAngle = 0;
        }
        if (e.touches.length === 0) {
            handlePointerUp();
        }
    });

    element.onpointerdown = (e) => {
        selectedElement = element;
        handlePointerDown(e);
    };

    function handlePointerDown(e) {
        e.preventDefault();
        
        // Store initial scale and rotation
        const transform = element.style.transform;
        const scaleMatch = transform.match(/scale\(([\d.]+)\)/);
        const rotateMatch = transform.match(/rotate\(([\d.-]+)deg\)/);
        
        if (scaleMatch) scale = parseFloat(scaleMatch[1]);
        if (rotateMatch) rotation = parseFloat(rotateMatch[1]);
        
        // Initialize position tracking
        if (element.style.top === '' || element.style.top === 'auto') {
            const rect = element.getBoundingClientRect();
            const parentRect = element.parentElement.getBoundingClientRect();
            element.style.top = (rect.top - parentRect.top + element.parentElement.scrollTop) + 'px';
            element.style.left = (rect.left - parentRect.left + element.parentElement.scrollLeft) + 'px';
        }
        
        currentX = e.clientX;
        currentY = e.clientY;
        
        element.setAttribute('data-dragging', 'true');
        document.onpointermove = handlePointerMove;
        document.onpointerup = handlePointerUp;
        document.onwheel = handleWheel;
        document.oncontextmenu = handleRightClick;
    }

    function handlePointerMove(e) {
        // Calculate distance moved
        const moveX = currentX - e.clientX;
        const moveY = currentY - e.clientY;

        // Update position tracking
        currentX = e.clientX;
        currentY = e.clientY;
        updateStatus(`Dragging ${element.id} | X:${currentX}, Y:${currentY}`);

        // Get current position or default to 0
        const currentTop = parseFloat(element.style.top) || 0;
        const currentLeft = parseFloat(element.style.left) || 0;

        // Apply movement to element
        element.style.top = (currentTop - moveY) + 'px';
        element.style.left = (currentLeft - moveX) + 'px';
    }

    function handleWheel(e) {
        if (e.target === element) {
            e.preventDefault();
            
            // Scroll up to increase size, scroll down to decrease size
            scale += e.deltaY > 0 ? -0.05 : 0.05;
            scale = Math.max(0.3, Math.min(3, scale)); // Clamp between 0.3 and 3
            
            updateTransform();
        }
    }

    function handleRightClick(e) {
        if (e.target === element) {
            e.preventDefault();
            
            // Right-click to rotate (15 degrees per click)
            rotation = (rotation + 15) % 360;
            updateTransform();
        }
    }

    function updateTransform() {
        element.style.setProperty('--scale', scale);
        element.style.setProperty('--rotation', `${rotation}deg`);
        element.style.transform = `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`;
    }

    function handlePointerUp() {
        element.removeAttribute('data-dragging');
        updateStatus('Drag a plant or animal to see coordinates.');
        document.onpointermove = null;
        document.onpointerup = null;
        document.onwheel = null;
        document.oncontextmenu = null;
    }
}