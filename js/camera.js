// Captura de fotos desde cámara (web/móvil) o archivos

let currentStream = null;

// Detectar tipo de dispositivo
export function getDeviceType() {
    const ua = navigator.userAgent.toLowerCase();
    if (/android/.test(ua)) return 'android';
    if (/iphone|ipad|ipod/.test(ua)) return 'ios';
    return 'pc';
}

// Verificar si hay cámara disponible
export async function hasCamera() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.some(device => device.kind === 'videoinput');
    } catch (e) {
        return false;
    }
}

// Iniciar cámara
export async function startCamera(videoElement, facingMode = 'environment') {
    if (currentStream) {
        stopCamera();
    }
    
    try {
        const constraints = {
            video: {
                facingMode: { exact: facingMode },
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };
        
        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        videoElement.srcObject = currentStream;
        videoElement.play();
        return true;
    } catch (error) {
        console.error('Error al iniciar cámara:', error);
        return false;
    }
}

// Detener cámara
export function stopCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
}

// Capturar foto desde video
export function capturePhoto(videoElement) {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    // Convertir a base64 con compresión
    return canvas.toDataURL('image/jpeg', 0.8);
}

// Seleccionar archivo (fallback)
export function selectFile() {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = false;
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    resolve(event.target.result);
                };
                reader.readAsDataURL(file);
            } else {
                resolve(null);
            }
        };
        
        input.click();
    });
}

// Tomar foto (intenta cámara primero, fallback a archivo)
export async function takePhoto(videoElement) {
    const deviceType = getDeviceType();
    const hasCam = await hasCamera();
    
    if (hasCam && (deviceType === 'android' || deviceType === 'ios')) {
        // En móvil, usar cámara nativa
        return capturePhoto(videoElement);
    } else {
        // En PC o si falla cámara, usar selector de archivos
        return selectFile();
    }
}

// Capturar múltiples fotos
export async function captureMultiplePhotos(maxPhotos = 5, onPhotoCaptured = null) {
    const photos = [];
    const deviceType = getDeviceType();
    const hasCam = await hasCamera();
    
    // Crear contenedor para la cámara
    const modalHtml = `
        <div class="modal fade" id="cameraModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5>📸 Capturar fotos (${photos.length}/${maxPhotos})</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-center">
                        <video id="cameraVideo" autoplay playsinline style="width:100%; max-height:400px; background:#000;"></video>
                        <canvas id="photoCanvas" style="display:none;"></canvas>
                        <div id="photoPreview" class="mt-3 d-flex flex-wrap gap-2"></div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" id="captureBtn">📸 Tomar foto</button>
                        ${!hasCam ? `<button class="btn btn-secondary" id="uploadBtn">📁 Subir archivo</button>` : ''}
                        <button class="btn btn-success" id="finishCaptureBtn" ${photos.length === 0 ? 'disabled' : ''}>✅ Finalizar (${photos.length} fotos)</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Mostrar modal (implementación simplificada)
    // En producción, usarías Bootstrap modal
    
    // Simulación de retorno
    return new Promise((resolve) => {
        // Demo: retornar algunas fotos placeholder
        resolve(['https://picsum.photos/200/200', 'https://picsum.photos/201/200']);
    });
}