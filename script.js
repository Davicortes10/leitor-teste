// Elementos DOM
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const photoPreview = document.getElementById('photoPreview');
const resultContainer = document.getElementById('resultContainer');
const resultContent = document.getElementById('resultContent');
const loading = document.querySelector('.loading');
const errorMessage = document.getElementById('errorMessage');
const cameraMessage = document.getElementById('cameraMessage');

let stream = null;
let photoData = null;

// Inicializar câmera
async function initCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false
        });
        video.srcObject = stream;
        cameraMessage.style.display = 'none';
    } catch (err) {
        cameraMessage.textContent = 'Não foi possível acessar a câmera. Verifique as permissões.';
    }
}

// Capturar foto
function capturePhoto() {
    const width = video.videoWidth;
    const height = video.videoHeight;
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, width, height);
    photoData = canvas.toDataURL('image/jpeg');
    photoPreview.src = photoData;
    video.style.display = 'none';
    photoPreview.style.display = 'block';
    sendPhoto();
}

// Enviar foto para a API
async function sendPhoto() {
    if (!photoData) return;

    loading.style.display = 'block';
    errorMessage.style.display = 'none';

    try {
        const blob = dataURLtoBlob(photoData);
        const formData = new FormData();
        formData.append('image', blob, 'qrcode.jpg');

        const response = await fetch('https://gerador-gabarito-leitor-qrcode.lh6c5d.easypanel.host/api/ler-qrcode/', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status}`);
        }

        const data = await response.json();
        displayResult(data);
    } catch (err) {
        errorMessage.textContent = 'Erro ao processar a imagem. Tente novamente.';
        errorMessage.style.display = 'block';
    } finally {
        loading.style.display = 'none';
    }
}

// Converter Data URL para Blob
function dataURLtoBlob(dataURL) {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    const u8arr = new Uint8Array(bstr.length);
    for (let i = 0; i < bstr.length; i++) {
        u8arr[i] = bstr.charCodeAt(i);
    }
    return new Blob([u8arr], { type: mime });
}

// Exibir resultados
function displayResult(data) {
    resultContent.innerHTML = '';
    addResultItem('ID', data.id);
    addResultItem('Nome do Aluno', data.aluno_nome);
    addResultItem('Total de Questões', data.total_questoes);
    addResultItem('Prova', data.prova);
    addResultItem('Matrícula', data.matricula);
    addResultItem('Escola', data.escola.nome);
    addResultItem('Região', data.escola.regiao);
    addResultItem('Grupo', data.escola.grupo);
    addResultItem('Turma', data.turma.nome);
    addResultItem('Série', data.turma.serie);
    addResultItem('Turno', data.turma.turno);
    resultContainer.style.display = 'block';
}

// Adicionar item ao resultado
function addResultItem(label, value) {
    const div = document.createElement('div');
    div.className = 'result-item';
    div.innerHTML = `
        <div class="result-label">${label}:</div>
        <div>${value || 'N/A'}</div>
    `;
    resultContent.appendChild(div);
}

// Iniciar captura contínua a cada 2 segundos
function startCaptureLoop() {
    setInterval(() => {
        capturePhoto();
    }, 2000); // 2 segundos
}

// Inicializar quando a página carregar
window.addEventListener('DOMContentLoaded', () => {
    initCamera();
    startCaptureLoop(); // Iniciar o loop de captura
});
