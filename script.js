let participants = [];
const totalWheels = 8;
const wheelsState = [];
let wheelTemplateCanvas = null;

// --- ระบบเสียงสังเคราะห์ผ่าน Web Audio API (ไม่ต้องโหลดไฟล์เสียงภายนอก) ---
let audioCtx = null;
function getAudioContext() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

function playTickSound(pitch = 780) {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.045);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
}

function playSpinSoundForDuration(durationMs = 4500) {
    const startTime = Date.now();
    let step = 0;

    function tickLoop() {
        const elapsed = Date.now() - startTime;
        if (elapsed >= durationMs) return;

        // ค่อยๆ ชะลอจังหวะเสียงติ๊กตามการชะลอของวงล้อ
        const progress = elapsed / durationMs;
        const dynamicPitch = 920 - progress * 360 + (step % 2 === 0 ? 60 : -40);
        playTickSound(dynamicPitch);

        step++;
        const nextDelay = Math.min(260, 55 + Math.pow(progress, 2.2) * 210);
        setTimeout(tickLoop, nextDelay);
    }

    tickLoop();
}

function playWinSound() {
    const ctx = getAudioContext();
    if (!ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
        const now = ctx.currentTime + idx * 0.11;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.36);
    });
}

// ชุดสีสำหรับช่องวงล้อ (โทนสีตัดกันชัดเจน อ่านตัวอักษรขาวง่าย)
const sliceColors = [
    '#9c1b31', '#1b5e58', '#c68b2c', '#2c3e75',
    '#b8293d', '#24756d', '#d99b38', '#3c5296'
];

// ลิงก์ CSV จาก Google Sheet ของคุณ
const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vToP5SirNr1LvKDTzQOsDSErafGH06lQKDMsjPiDUC9Cq6zfQQAbD-SsRwn_16g71PsEEmK1uh9We2b/pub?output=csv';

window.onload = async () => {
    try {
        const response = await fetch(csvUrl);
        const csvText = await response.text();
        parseCSV(csvText);
        
        if (participants.length === 0) {
            alert('ไม่พบรายชื่อใน Google Sheet หรือลิงก์ผิดพลาด');
            return;
        }
        buildWheelTemplate();
        setupUI();
        renderAllWheels();
    } catch (error) {
        console.error('เกิดข้อผิดพลาด:', error);
    }
};

function parseCSV(csvText) {
    const lines = csvText.split('\n');
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === '') continue;
        
        const columns = line.split(',');
        const name = columns[0] ? columns[0].trim() : "ไม่มีชื่อ";
        let img = columns[1] ? columns[1].trim() : "";
        
        if (!img) {
            img = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=150`;
        }
        participants.push({ name: name, img: img });
    }
}

function buildWheelTemplate() {
    const size = 344;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const numSlices = participants.length;
    const arcSize = (2 * Math.PI) / numSlices;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2;

    const sliceArcPx = radius * arcSize;
    let fontSize = Math.floor(sliceArcPx * 0.62);
    fontSize = Math.max(8, Math.min(15, fontSize));

    for (let i = 0; i < numSlices; i++) {
        const startAngle = i * arcSize;
        const endAngle = startAngle + arcSize;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = sliceColors[i % sliceColors.length];
        ctx.fill();

        ctx.lineWidth = 1.2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.stroke();

        ctx.clip();

        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + arcSize / 2);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${fontSize}px "Sarabun", sans-serif`;

        ctx.fillText(participants[i].name, radius - 10, 0);
        ctx.restore();
    }

    wheelTemplateCanvas = canvas;
}

function renderAllWheels() {
    if (!wheelTemplateCanvas) return;
    for (let i = 1; i <= totalWheels; i++) {
        const targetCanvas = document.getElementById(`wheel-${i}`);
        if (targetCanvas) {
            const tctx = targetCanvas.getContext('2d');
            tctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
            tctx.drawImage(wheelTemplateCanvas, 0, 0, targetCanvas.width, targetCanvas.height);
        }
    }
}

function setupUI() {
    const wheelsContainer = document.getElementById('wheels-container');
    const summaryContainer = document.getElementById('summary-container');

    wheelsContainer.innerHTML = '';
    summaryContainer.innerHTML = '';

    for (let i = 1; i <= totalWheels; i++) {
        wheelsState[i] = 0; 

        wheelsContainer.innerHTML += `
            <div class="wheel-card" style="overflow: hidden; position: relative;">
                <h3>วงล้อที่ ${i}</h3>
                <div class="wheel-wrapper" style="position: relative; width: 180px; height: 180px; margin: 0 auto 15px auto;">
                    <div class="pointer"></div>
                    <div class="wheel-clip" style="position: relative; width: 180px; height: 180px; border-radius: 50%; overflow: hidden; border: 4px solid #ffd54f;">
                        <canvas class="wheel-canvas" id="wheel-${i}" width="172" height="172" style="display: block; width: 172px; height: 172px; max-width: 172px; max-height: 172px; border-radius: 50%;"></canvas>
                    </div>
                    <img src="Well2.jpg" alt="Well Logo" class="wheel-center-logo">
                </div>
                <div id="wheel-winner-name-${i}" class="wheel-winner-name">รอการสุ่ม...</div>
                <button class="btn-spin" id="btn-spin-${i}" onclick="spinWheel(${i})">หมุนวงล้อที่ ${i}</button>
            </div>
        `;

        summaryContainer.innerHTML += `
            <div class="summary-card" id="summary-${i}">
                <h4 style="margin:5px 0 10px 0; color:#8e24aa;">วงล้อที่ ${i}</h4>
                <img id="summary-img-${i}" src="https://via.placeholder.com/150?text=?" alt="?" onclick="openImageViewer(this.src, document.getElementById('summary-name-${i}').innerText)">
                <div id="summary-name-${i}" style="font-weight:bold; color:#555;">รอการสุ่ม...</div>
            </div>
        `;
    }
}

function spinWheel(wheelIndex, withSound = true) {
    const wheelElement = document.getElementById(`wheel-${wheelIndex}`);
    const btnElement = document.getElementById(`btn-spin-${wheelIndex}`);
    const winnerNameElement = document.getElementById(`wheel-winner-name-${wheelIndex}`);
    
    btnElement.disabled = true; 
    winnerNameElement.innerText = "กำลังสุ่ม...";
    winnerNameElement.style.color = "#888";

    if (withSound) {
        playSpinSoundForDuration(4500);
    }

    const randomDegree = Math.floor(Math.random() * 360);
    const extraSpins = 360 * 6; 
    wheelsState[wheelIndex] += extraSpins + randomDegree;
    wheelElement.style.transform = `rotate(${wheelsState[wheelIndex]}deg)`;

    setTimeout(() => {
        const numSlices = participants.length;
        const sliceDeg = 360 / numSlices;
        const normalizedDeg = wheelsState[wheelIndex] % 360;
        const pointerAngle = (360 - normalizedDeg) % 360;
        const winnerIndex = Math.floor(pointerAngle / sliceDeg) % numSlices;
        const winner = participants[winnerIndex];

        winnerNameElement.innerText = "🎉 " + winner.name;
        winnerNameElement.style.color = "#d32f2f";

        document.getElementById(`summary-img-${wheelIndex}`).src = winner.img;
        document.getElementById(`summary-name-${wheelIndex}`).innerText = winner.name;
        document.getElementById(`summary-name-${wheelIndex}`).style.color = "#333";

        if (withSound) {
            playWinSound();
        }
        fireConfetti();
        showModal(wheelIndex, winner);
        
        btnElement.disabled = false;
        btnElement.innerText = "หมุนใหม่";
    }, 4500);
}

function spinAll() {
    playSpinSoundForDuration(4700);
    for (let i = 1; i <= totalWheels; i++) {
        setTimeout(() => { spinWheel(i, false); }, i * 200); 
    }
    setTimeout(() => {
        playWinSound();
    }, 4500);
}

function showModal(wheelNum, winner) {
    document.getElementById('modal-wheel-num').innerText = wheelNum;
    document.getElementById('modal-img').src = winner.img;
    document.getElementById('modal-name').innerText = winner.name;
    document.getElementById('winner-modal').style.display = "flex";
}

function closeModal() {
    document.getElementById('winner-modal').style.display = "none";
}

function openImageViewer(src, name) {
    if (src.includes('via.placeholder.com')) return;
    document.getElementById('full-image').src = src;
    document.getElementById('viewer-name').innerText = name;
    document.getElementById('image-viewer').style.display = "flex";
}

function closeImageViewer() {
    document.getElementById('image-viewer').style.display = "none";
}

function fireConfetti() {
    var duration = 3 * 1000;
    var animationEnd = Date.now() + duration;
    var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };
    function randomInRange(min, max) { return Math.random() * (max - min) + min; }
    var interval = setInterval(function() {
        var timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) { return clearInterval(interval); }
        var particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
}
