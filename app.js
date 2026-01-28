const video = document.getElementById('webcam');
const status = document.getElementById('status');
const logList = document.getElementById('log-list');

// 1. CONFIGURATION
const studentDatabase = ['Santhosh', 'ram', 'raven', 'dharshan', 'Harish'];
const STAFF_PASSWORD = "REC"; 

// 2. DATA PERSISTENCE: Load stored data
let attendanceRecords = JSON.parse(localStorage.getItem('rec_attendance')) || [];
let scannedToday = new Set(JSON.parse(localStorage.getItem('rec_scanned_today')) || []);
let isProcessing = false; 

async function start() {
    status.innerText = "Initializing REC AI...";
    try {
        await Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri('./models'),
            faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
            faceapi.nets.faceRecognitionNet.loadFromUri('./models')
        ]);

        const labeledDescriptors = await loadImages();
        const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.45); 

        status.innerText = "REC System Live - Scanning...";
        
        // Render any existing logs from storage
        renderLogs();
        startVideo();

        // AUTO-SCAN LOOP
        setInterval(async () => {
            if (isProcessing) return; 

            const detection = await faceapi.detectSingleFace(video)
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (detection) {
                const match = faceMatcher.findBestMatch(detection.descriptor);
                
                if (match.label !== 'unknown') {
                    if (!scannedToday.has(match.label)) {
                        recordAttendance(match.label);
                    } else {
                        status.innerText = `Recognized: ${match.label} (Already Marked)`;
                        status.className = "status-indicator success";
                    }
                } else {
                    status.innerText = "⚠️ Identity Not Found";
                    status.className = "status-indicator warning";
                }
            } else {
                status.innerText = "Scanning for faces...";
                status.className = "status-indicator";
            }
        }, 500); 

    } catch (err) { 
        console.error(err);
        status.innerText = "Model Load Error - Check /models folder"; 
    }
}

function recordAttendance(name) {
    isProcessing = true; 
    
    // Save as numeric timestamp to prevent "Invalid Date" errors
    const timestamp = Date.now(); 
    const timeDisplay = new Date(timestamp).toLocaleTimeString();
    const securityHash = btoa(name + timestamp).substr(0, 8);

    const newEntry = { Name: name, Time: timestamp, Hash: securityHash };
    
    attendanceRecords.push(newEntry);
    scannedToday.add(name);

    // Save to LocalStorage
    localStorage.setItem('rec_attendance', JSON.stringify(attendanceRecords));
    localStorage.setItem('rec_scanned_today', JSON.stringify([...scannedToday]));

    status.innerText = `✅ Verified: ${name}`;
    status.className = "status-indicator success";

    addLogToUI(timeDisplay);

    setTimeout(() => {
        isProcessing = false; 
        status.innerText = "Ready for next student";
        status.className = "status-indicator";
    }, 3000); 
}

function renderLogs() {
    logList.innerHTML = "";
    // Pull the last 10 records and display them
    attendanceRecords.slice(-10).forEach(record => {
        const dateObj = new Date(record.Time);
        const time = isNaN(dateObj) ? "Unknown Time" : dateObj.toLocaleTimeString();
        addLogToUI(time);
    });
}

function addLogToUI(time) {
    const li = document.createElement('li');
    li.innerText = `Attendance marked at ${time}`;
    logList.prepend(li);
}

async function loadImages() {
    return Promise.all(
        studentDatabase.map(async label => {
            try {
                const img = await faceapi.fetchImage(`./labeled_images/${label}.jpeg`);
                const detections = await faceapi.detectSingleFace(img)
                    .withFaceLandmarks()
                    .withFaceDescriptor();
                return new faceapi.LabeledFaceDescriptors(label, [detections.descriptor]);
            } catch (e) {
                console.warn(`Missing file: ./labeled_images/${label}.jpeg`);
                return null;
            }
        })
    ).then(res => res.filter(r => r !== null));
}

function startVideo() {
    navigator.mediaDevices.getUserMedia({ video: {} }).then(s => video.srcObject = s);
}

function unlockAdmin() {
    const key = document.getElementById('staff-key').value;
    if (key === STAFF_PASSWORD) {
        document.getElementById('admin-login-area').style.display = 'none';
        document.getElementById('admin-actions').style.display = 'block';
    } else { alert("Unauthorized Access!"); }
}

function lockAdmin() {
    document.getElementById('admin-login-area').style.display = 'block';
    document.getElementById('admin-actions').style.display = 'none';
    document.getElementById('staff-key').value = "";
}

function resetSystem() {
    if(confirm("Are you sure? This will delete all records stored in this browser.")) {
        localStorage.clear();
        location.reload();
    }
}

document.getElementById('download-btn').addEventListener('click', () => {
    let csv = "Student Name,Timestamp,Security Hash\n";
    attendanceRecords.forEach(r => {
        const dateStr = new Date(r.Time).toLocaleString();
        csv += `${r.Name},${dateStr},${r.Hash}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `REC_Attendance_Report.csv`;
    a.click();
});

start();