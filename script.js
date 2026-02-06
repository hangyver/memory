document.addEventListener('DOMContentLoaded', () => {
    const plateCircle = document.getElementById('plate-circle');
    const totalPlates = 20;
    const radius = 250; // Radius of the circle in px

    // Create 20 plates
    for (let i = 1; i <= totalPlates; i++) {
        createPlate(i);
    }

    function createPlate(number) {
        const wrapper = document.createElement('div');
        wrapper.className = 'plate-wrapper';
        
        // Calculate angle
        // Plate 1 is at ~18 degrees (top rightish), Plate 20 is at ~-18 degrees (top leftish)
        // Let's start from top ( -90 deg in CSS) and add offset
        // 360 / 20 = 18 degrees per plate.
        // If index 1 is at 9 degrees
        // index 2 is at 27 degrees...
        // Formula: angle = (number * 18) - 9 (to center the gap at top)
        // Wait, looking at image:
        // Top gap is between 20 and 1.
        // So 20 is at ~351 deg, 1 is at ~9 deg. (0 is straight up for now)
        
        const angleStep = 360 / totalPlates;
        // Adjusting starting angle so 1 is slightly right of top
        const angleDeg = (number * angleStep) - 90 - (angleStep / 2); 
        // -90 to rotate so 0 is top. 
        // - (angleStep/2) to shift so 1 is at 9 degrees (since i=1 gives 18, we want 9? No.)
        
        // Let's try: i=1 -> 18 deg. We want it at 9 deg?
        // If 0 is top. 
        // i=1 -> 9 deg
        // i=2 -> 27 deg
        // ...
        // i=20 -> 351 deg (-9 deg)
        // Formula: (i * 18) - 9
        
        const simpleAngle = (number * angleStep) - (angleStep / 2);
        // Correct for CSS logic where 0 is Right. 
        // We want 0 (Top) to be -90.
        const cssAngle = simpleAngle - 90;

        const x = Math.cos(cssAngle * Math.PI / 180) * radius;
        const y = Math.sin(cssAngle * Math.PI / 180) * radius;

        wrapper.style.transform = `translate(${x}px, ${y}px)`;

        const plate = document.createElement('div');
        plate.className = 'plate';
        plate.innerHTML = `<span class="plate-number">${number}</span>`;
        
        plate.addEventListener('click', () => handlePlateClick(number));

        wrapper.appendChild(plate);
        plateCircle.appendChild(wrapper);
    }

    function handlePlateClick(number) {
        console.log(`Plate ${number} clicked`);
        // Logic will be added here
        alert(`Plate ${number} selected! Needs game rules.`);
    }
});
