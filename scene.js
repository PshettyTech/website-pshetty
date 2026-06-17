/* ═══════════════════════════════════════════════════════════
   SCENE.JS — Three.js Scene Setup & Frame Sequence Engine
   OPTIMIZED: MeshBasicMaterial, cover-fit sizing, minimal GPU work
   ═══════════════════════════════════════════════════════════ */

const SceneManager = (() => {
    // ─── CONFIG ───
    const CONFIG = {
        FRAME_COUNT: 90,
        FRAME_PREFIX: 'pshetty img/ezgif-frame-',
        FRAME_EXT: '.jpg',
        CAMERA_INITIAL_Z: 3.0,
        IMAGE_ASPECT: 16 / 9, // frame images are 16:9
    };

    // ─── STATE ───
    let scene, camera, renderer, canvas;
    let framePlane, frameMaterial;
    let textures = [];
    let currentFrameIndex = -1;
    let isReady = false;
    let onLoadProgress = null;
    let onLoadComplete = null;

    // Camera smoothing
    let cameraTarget = { z: CONFIG.CAMERA_INITIAL_Z, rotX: 0, rotY: 0 };
    let cameraCurrent = { z: CONFIG.CAMERA_INITIAL_Z, rotX: 0, rotY: 0 };

    // ─── INIT ───
    function init(canvasElement, progressCb, completeCb) {
        canvas = canvasElement;
        onLoadProgress = progressCb;
        onLoadComplete = completeCb;

        _createScene();
        _createCamera();
        _createRenderer();
        _createFramePlane();
        _loadTextures();
        _handleResize();
        window.addEventListener('resize', _handleResize);
    }

    function _createScene() {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf5f5f5);
    }

    function _createCamera() {
        const aspect = window.innerWidth / window.innerHeight;
        camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);
        camera.position.set(0, 0, CONFIG.CAMERA_INITIAL_Z);
    }

    function _createRenderer() {
        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: false,        // OFF for performance
            alpha: false,
            powerPreference: 'high-performance',
            stencil: false,
            depth: false,            // 2D plane doesn't need depth
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // cap at 1.5x
    }

    // ─── COVER-FIT PLANE ───
    function _calcPlaneDimensions() {
        const vFov = (camera.fov * Math.PI) / 180;
        const dist = CONFIG.CAMERA_INITIAL_Z;
        const visibleH = 2 * Math.tan(vFov / 2) * dist;
        const visibleW = visibleH * (window.innerWidth / window.innerHeight);
        const viewAspect = window.innerWidth / window.innerHeight;

        let pw, ph;
        if (viewAspect > CONFIG.IMAGE_ASPECT) {
            // viewport wider than image → match width, overflow height
            pw = visibleW;
            ph = pw / CONFIG.IMAGE_ASPECT;
        } else {
            // viewport taller → match height, overflow width
            ph = visibleH;
            pw = ph * CONFIG.IMAGE_ASPECT;
        }
        // slight overscan for camera movement
        return { w: pw * 1.12, h: ph * 1.12 };
    }

    function _createFramePlane() {
        const { w, h } = _calcPlaneDimensions();
        const geo = new THREE.PlaneGeometry(w, h);

        // Simple MeshBasicMaterial — fastest possible rendering
        frameMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            map: null,
            toneMapped: false,
        });

        framePlane = new THREE.Mesh(geo, frameMaterial);
        framePlane.position.z = 0;
        scene.add(framePlane);
    }

    // ─── TEXTURE LOADING ───
    function _loadTextures() {
        const loader = new THREE.TextureLoader();
        let loaded = 0;
        textures = new Array(CONFIG.FRAME_COUNT);

        for (let i = 0; i < CONFIG.FRAME_COUNT; i++) {
            const num = String(i + 1).padStart(3, '0');
            const url = `${CONFIG.FRAME_PREFIX}${num}${CONFIG.FRAME_EXT}`;

            loader.load(url, (tex) => {
                tex.minFilter = THREE.LinearFilter;
                tex.magFilter = THREE.LinearFilter;
                tex.generateMipmaps = false;
                tex.encoding = THREE.sRGBEncoding;
                textures[i] = tex;
                loaded++;

                if (onLoadProgress) onLoadProgress((loaded / CONFIG.FRAME_COUNT) * 100);
                if (loaded === CONFIG.FRAME_COUNT) _onLoaded();
            }, undefined, () => {
                loaded++;
                if (onLoadProgress) onLoadProgress((loaded / CONFIG.FRAME_COUNT) * 100);
                if (loaded === CONFIG.FRAME_COUNT) _onLoaded();
            });
        }
    }

    function _onLoaded() {
        if (textures[0]) {
            frameMaterial.map = textures[0];
            frameMaterial.needsUpdate = true;
        }
        currentFrameIndex = 0;
        isReady = true;
        if (onLoadComplete) onLoadComplete();
    }

    // ─── FRAME CONTROL (only swap when index changes) ───
    function setFrame(floatIndex) {
        if (!isReady) return;
        const idx = Math.max(0, Math.min(CONFIG.FRAME_COUNT - 1, Math.round(floatIndex)));
        if (idx === currentFrameIndex) return; // skip if same
        if (textures[idx]) {
            frameMaterial.map = textures[idx];
            // No need for needsUpdate on MeshBasicMaterial map swap
            currentFrameIndex = idx;
        }
    }

    // ─── CAMERA ───
    function setCameraZ(z) { cameraTarget.z = z; }
    function setCameraRotation(rx, ry) {
        cameraTarget.rotX = rx;
        cameraTarget.rotY = ry;
    }

    // ─── RENDER (called each rAF) ───
    function render() {
        if (!isReady) return;

        // Smooth camera lerp
        const L = 0.07;
        cameraCurrent.z += (cameraTarget.z - cameraCurrent.z) * L;
        cameraCurrent.rotX += (cameraTarget.rotX - cameraCurrent.rotX) * L;
        cameraCurrent.rotY += (cameraTarget.rotY - cameraCurrent.rotY) * L;

        camera.position.z = cameraCurrent.z;
        camera.rotation.x = cameraCurrent.rotX;
        camera.rotation.y = cameraCurrent.rotY;

        renderer.render(scene, camera);
    }

    // ─── RESIZE ───
    function _handleResize() {
        if (!camera || !renderer) return;
        const w = window.innerWidth, h = window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);

        if (framePlane) {
            const dim = _calcPlaneDimensions();
            framePlane.geometry.dispose();
            framePlane.geometry = new THREE.PlaneGeometry(dim.w, dim.h);
        }
    }

    return {
        init, setFrame, setCameraZ, setCameraRotation, render,
        getScene: () => scene,
        getCamera: () => camera,
        getRenderer: () => renderer,
        getConfig: () => ({ ...CONFIG }),
        getIsReady: () => isReady,
        getCurrentFrame: () => currentFrameIndex,
    };
})();
