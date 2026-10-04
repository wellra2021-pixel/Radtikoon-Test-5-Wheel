// ตัวแปรเก็บรายชื่อที่จะดึงจาก Google Sheet
let participants = [];
const totalWheels = 8;
const wheelsState = [];

// 🔴🔴🔴 นำลิงก์ CSV จาก Google Sheet ของคุณมาวางในเครื่องหมายคำพูดด้านล่างนี้ 🔴🔴🔴
const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vToP5SirNr1LvKDTzQOsDSErafGH06lQKDMsjPiDUC9Cq6zfQQAbD-SsRwn_16g71PsEEmK1uh9We2b/pub?output=csv';

// ฟังก์ชันเริ่มทำงานเมื่อโหลดหน้าเว็บ
window.onload = async () => {
    try {
        // ดึงข้อมูลจาก Google Sheet
        const response = await fetch(csvUrl);
        const csvText = await response.text();
        
        // แปลงข้อมูล CSV และเก็บลงตัวแปร participants
        parseCSV(csvText);
        
        // ตรวจสอบว่ามีข้อมูลหรือไม่
        if (participants.length === 0) {
            alert('ไม่พบรายชื่อใน Google Sheet หรือลิงก์ผิดพลาด กรุณาตรวจสอบลิงก์ CSV อีกครั้ง');
            return;
        }

        // สร้างหน้าจอวงล้อ
        setupUI();
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการดึงข้อมูล:', error);
        alert('ไม่สามารถดึงข้อมูลจาก Google Sheet ได้ กรุณาตรวจสอบลิงก์');
    }
};

// ฟังก์ชันแปลงข้อความ CSV เป็น Array ของรายชื่อ
function parseCSV(csvText) {
    const lines = csvText.split('\n');
    
    // เริ่ม loop ที่ i=1 เพื่อข้ามแถวแรก (Header)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === '') continue; // ข้ามบรรทัดว่าง
        
        // แยกข้อมูลด้วยลูกน้ำ (Comma)
        const columns = line.split(',');
        
        // ดึงชื่อจากคอลัมน์ A (index 0) และรูปจากคอลัมน์ B (index 1)
        const name = columns[0] ? columns[0].trim() : "ไม่มีชื่อ";
        let img = columns[1] ? columns[1].trim() : "";
        
        // ถ้ารูปว่างเปล่า ให้ใช้รูป Placeholder แทน
        if (!img) {
            img = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=150`;
        }

        participants.push({ name: name, img: img });
    }
}

// ฟังก์ชันสร้าง UI วงล้อและสรุปผล
function setupUI() {
    const wheelsContainer = document.getElementById('wheels-container');
    const summaryContainer = document.getElementById('summary-container');

    // เคลียร์หน้าจอก่อนสร้างใหม่
    wheelsContainer.innerHTML = '';
    summaryContainer.innerHTML = '';

    for (let i = 1; i <= totalWheels; i++) {
        wheelsState[i] = 0; // องศาเริ่มต้น

        wheelsContainer.innerHTML += `
            <div class="wheel-card">
                <h3>วงล้อที่ ${i}</h3>
                <div class="wheel-wrapper">
                    <div class="pointer"></div>
                    <div class="wheel" id="wheel-${i}"></div>
                </div>
                <button class="btn-spin" id="btn-spin-${i}" onclick="spinWheel(${i})">หมุนวงล้อที่ ${i}</button>
            </div>
        `;

        summaryContainer.innerHTML += `
            <div class="summary-card" id="summary-${i}">
                <h4 style="margin:5px 0; color:#666;">วงล้อที่ ${i}</h4>
                <img id="summary-img-${i}" src="https://via.placeholder.com/80?text=?" alt="?">
                <div id="summary-name-${i}">รอการสุ่ม...</div>
            </div>
        `;
    }
}

// ฟังก์ชันหมุนวงล้อเดี่ยว
function spinWheel(wheelIndex) {
    const wheelElement = document.getElementById(`wheel-${wheelIndex}`);
    const btnElement = document.getElementById(`btn-spin-${wheelIndex}`);
    
    btnElement.disabled = true; // ปิดปุ่มระหว่างหมุน

    // สุ่มองศาเพิ่มเข้าไป (หมุนอย่างน้อย 5 รอบ)
    const randomDegree = Math.floor(Math.random() * 360);
    const extraSpins = 360 * 5; 
    wheelsState[wheelIndex] += extraSpins + randomDegree;

    // สั่งหมุนผ่าน CSS
    wheelElement.style.transform = `rotate(${wheelsState[wheelIndex]}deg)`;

    // รอ 4 วินาทีให้แอนิเมชันหยุด
    setTimeout(() => {
        // สุ่มรายชื่อผู้ชนะจากข้อมูล Google Sheet
        const winnerIndex = Math.floor(Math.random() * participants.length);
        const winner = participants[winnerIndex];

        // อัปเดตหน้าสรุปผล
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

// ฟังก์ชันหมุนทุกวงล้อพร้อมกัน
function spinAll() {
    for (let i = 1; i <= totalWheels; i++) {
        setTimeout(() => {
            spinWheel(i);
        }, i * 200); 
    }
}

// ฟังก์ชันควบคุม Popup
function showModal(wheelNum, winner) {
    document.getElementById('modal-wheel-num').innerText = wheelNum;
    document.getElementById('modal-img').src = winner.img;
    document.getElementById('modal-name').innerText = winner.name;
    document.getElementById('winner-modal').style.display = "flex";
}

function closeModal() {
    document.getElementById('winner-modal').style.display = "none";
}

// ฟังก์ชันยิงพลุกระดาษ (Confetti)
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