let participants = [];
const totalWheels = 8;
const wheelsState = [];

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
        setupUI();
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

function setupUI() {
    const wheelsContainer = document.getElementById('wheels-container');
    const summaryContainer = document.getElementById('summary-container');

    wheelsContainer.innerHTML = '';
    summaryContainer.innerHTML = '';

    for (let i = 1; i <= totalWheels; i++) {
        wheelsState[i] = 0; 

        wheelsContainer.innerHTML += `
            <div class="wheel-card">
                <h3>วงล้อที่ ${i}</h3>
                <div class="wheel-wrapper">
                    <div class="pointer"></div>
                    <div class="wheel" id="wheel-${i}"></div>
                    <!-- แทรกโลโก้ Well2.jpg ตรงกลางวงล้อแบบกำหนดขนาดในตัว (Inline Style) -->
                    <img src="Well2.jpg" alt="Well Logo" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 60px; height: auto; z-index: 5; border-radius: 4px; box-shadow: 0px 2px 4px rgba(0,0,0,0.5);">
                </div>
                <div id="wheel-winner-name-${i}" class="wheel-winner-name">รอการสุ่ม...</div>
                <button class="btn-spin" id="btn-spin-${i}" onclick="spinWheel(${i})">หมุนวงล้อที่ ${i}</button>
            </div>
        `;

        summaryContainer.innerHTML += `
            <div class="summary-card" id="summary-${i}">
                <h4 style="margin:5px 0 10px 0; color:#8e24aa;">วงล้อที่ ${i}</h4>
                <!-- ส่งทั้งลิงก์รูป และ ชื่อผู้โชคดี ไปแสดงใน Popup -->
                <img id="summary-img-${i}" src="https://via.placeholder.com/150?text=?" alt="?" onclick="openImageViewer(this.src, document.getElementById('summary-name-${i}').innerText)">
                <div id="summary-name-${i}" style="font-weight:bold; color:#555;">รอการสุ่ม...</div>
            </div>
        `;
    }
}

function spinWheel(wheelIndex) {
    const wheelElement = document.getElementById(`wheel-${wheelIndex}`);
    const btnElement = document.getElementById(`btn-spin-${wheelIndex}`);
    const winnerNameElement = document.getElementById(`wheel-winner-name-${wheelIndex}`);
    
    btnElement.disabled = true; 
    winnerNameElement.innerText = "กำลังสุ่ม...";
    winnerNameElement.style.color = "#888";

    const randomDegree = Math.floor(Math.random() * 360);
    const extraSpins = 360 * 5; 
    wheelsState[wheelIndex] += extraSpins + randomDegree;
    wheelElement.style.transform = `rotate(${wheelsState[wheelIndex]}deg)`;

    setTimeout(() => {
        const winnerIndex = Math.floor(Math.random() * participants.length);
        const winner = participants[winnerIndex];

        winnerNameElement.innerText = "🎉 " + winner.name;
        winnerNameElement.style.color = "#d32f2f";

        document.getElementById(`summary-img-${wheelIndex}`).src = winner.img;
        document.getElementById(`summary-name-${wheelIndex}`).innerText = winner.name;
        document.getElementById(`summary-name-${wheelIndex}`).style.color = "#333";

        fireConfetti();
        showModal(wheelIndex, winner);
        
        btnElement.disabled = false;
        btnElement.innerText = "หมุนใหม่";
    }, 4000);
}

function spinAll() {
    for (let i = 1; i <= totalWheels; i++) {
        setTimeout(() => { spinWheel(i); }, i * 200); 
    }
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

// ฟังก์ชันเปิดดูรูปขยายใหญ่ (นำชื่อมาโชว์ใต้รูปด้วย)
function openImageViewer(src, name) {
    if (src.includes('via.placeholder.com')) return; // ถ้ารูปยังเป็นเครื่องหมายคำถาม จะไม่ให้กดดู
    
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
