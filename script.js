const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const tagInput = document.getElementById('tag-input');
const recordingList = document.getElementById('recording-list');

let mediaRecorder;
let audioChunks = [];
let recordings = loadRecordingsFromStorage();

document.addEventListener('DOMContentLoaded', displayRecordings);

startBtn.addEventListener('click', async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = (event) => {
    audioChunks.push(event.data);
  };

  mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(audioChunks, { type: 'audio/mpeg' });
    const audioBase64 = await blobToBase64(audioBlob);
    const tag = tagInput.value || 'Untitled';
    recordings.push({ audioBase64, tag });

    saveRecordingsToStorage();
    displayRecordings();
    audioChunks = [];
  };

  mediaRecorder.start();
  startBtn.disabled = true;
  stopBtn.disabled = false;
});

stopBtn.addEventListener('click', () => {
  mediaRecorder.stop();
  startBtn.disabled = false;
  stopBtn.disabled = true;
});

function displayRecordings() {
  recordingList.innerHTML = '';
  recordings.forEach((recording, index) => {
    const recordingDiv = document.createElement('div');
    recordingDiv.className = 'recording';

    const player = createCustomAudioPlayer(`data:audio/mpeg;base64,${recording.audioBase64}`);

    const tag = document.createElement('span');
    tag.textContent = recording.tag;

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => {
      recordings.splice(index, 1);
      saveRecordingsToStorage();
      displayRecordings();
    });

    recordingDiv.appendChild(player);
    recordingDiv.appendChild(tag);
    recordingDiv.appendChild(deleteBtn);
    recordingList.appendChild(recordingDiv);
  });

  if (recordings.length === 0) {
    recordingList.innerHTML = '<p>No recordings yet. Start recording to see them here!</p>';
  }
}

function createCustomAudioPlayer(audioSrc) {
  const container = document.createElement('div');
  container.className = 'custom-audio-player';

  const audio = new Audio(audioSrc);

  const playBtn = document.createElement('button');
  playBtn.textContent = 'Play';
  playBtn.addEventListener('click', () => {
    if (audio.paused) {
      audio.play();
      playBtn.textContent = 'Pause';
    } else {
      audio.pause();
      playBtn.textContent = 'Play';
    }
  });

  const progressBar = document.createElement('div');
  progressBar.className = 'progress-bar';

  const progress = document.createElement('span');
  progressBar.appendChild(progress);
  audio.addEventListener('timeupdate', () => {
    const percentage = (audio.currentTime / audio.duration) * 100;
    progress.style.width = `${percentage}%`;
  });

  container.appendChild(playBtn);
  container.appendChild(progressBar);

  return container;
}

function blobToBase64(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(blob);
  });
}

function saveRecordingsToStorage() {
  localStorage.setItem('recordings', JSON.stringify(recordings));
}

function loadRecordingsFromStorage() {
  const saved = localStorage.getItem('recordings');
  return saved ? JSON.parse(saved) : [];
}
