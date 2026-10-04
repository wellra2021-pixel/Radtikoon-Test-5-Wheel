let participants = [];
const totalWheels = 8;
const wheelsState = [];

// ลิงก์ CSV จาก Google Sheet 
const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vToP5SirNr1LvKDTzQOsDSErafGH06lQKDMsjPiDUC9Cq6zfQQAbD-SsRwn_16g71PsEEmK1uh9We2b/pub?output=csv';

window.onload = async () => {
    try {
        const response = await fetch(csvUrl);
        const csvText = await response.text();
        parseCSV(csvText);
        
        if (participants.length === 0) {
            alert('ไม่พบรายชื่อใน Google Sheet หรือลิงก์ผิดพลาด กรุณาตรวจสอบลิงก์ CSV อีกครั้ง');
            return;
        }
        setupUI();
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการดึงข้อมูล:', error);
        alert('ไม่สามารถดึงข้อมูลจาก Google Sheet ได้ กรุณาตรวจสอบลิงก์');
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

        // เพิ่ม <div id="wheel-winner-name-${i}"> สำหรับแสดงชื่อใต้วงล้อ
        wheelsContainer.innerHTML += `
            <div class="wheel-card">
                <h3>วงล้อที่ ${i}</h3>
                <div class="wheel-wrapper">
                    <div class="pointer"></div>
                    <div class="wheel" id="wheel-${i}"></div>
                </div>
                <div id="wheel-winner-name-${i}" class="wheel-winner-name">รอการสุ่ม...</div>
                <button class="btn-spin" id="btn-spin-${i}" onclick="spinWheel(${i})">หมุนวงล้อที่ ${i}</button>
            </div>
        `;

        summaryContainer.innerHTML += `
            <div class="summary-card" id="summary-${i}">
                <h4 style="margin:5px 0; color:#666;">วงล้อที่ ${i}</h4>
                <img id="summary-img-${i}" src="https://via.placeholder.com/80?text=?" alt="?" onclick="openImageViewer(this.src)">
                <div id="summary-name-${i}">รอการสุ่ม...</div>
            </div>
        `;
    }
}

function spinWheel(wheelIndex) {
    const wheelElement = document.getElementById(`wheel-${wheelIndex}`);
    const btnElement = document.getElementById(`btn-spin-${wheelIndex}`);
    const winnerNameElement = document.getElementById(`wheel-winner-name-${wheelIndex}`);
    
    // ตั้งค่าก่อนเริ่มหมุน
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

        // 1. อัปเดตชื่อแสดงใต้วงล้อ
        winnerNameElement.innerText = "🎉 " + winner.name;
        winnerNameElement.style.color = "#d32f2f"; // เปลี่ยนเป็นสีแดงเข้ม

        // 2. อัปเดตข้อมูลในส่วนสรุปผลด้านล่าง
        document.getElementById(`summary-img-${wheelIndex}`).src = winner.img;
        document.getElementById(`summary-name-${wheelIndex}`).innerText = winner.name;
        document.getElementById(`summary-name-${wheelIndex}`).style.color = "#d32f2f";
        document.getElementById(`summary-name-${wheelIndex}`).style.fontWeight = "bold";

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

function openImageViewer(src) {
    if (src.includes('via.placeholder.com/80?text=?')) return;
    document.getElementById('full-image').src = src;
    document.getElementById('image-viewer').style.display = "block";
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
