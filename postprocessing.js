/* ═══════════════════════════════════════════════════════════
   POSTPROCESSING.JS — Lightweight Visual Enhancement
   No CSS filter changes (they cause layout thrash + lag)
   Only ambient light adjustments in the Three.js scene
   ═══════════════════════════════════════════════════════════ */

const PostProcessing = (() => {
    let ambientLight = null;
    let isInit = false;

    function init(canvasEl, scene) {
        // Ambient light for subtle color grading
        ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
        scene.add(ambientLight);
        isInit = true;
    }

    function update(scrollProgress) {
        if (!isInit) return;

        // Gentle warm shift during dark sections of the video
        const isDark = scrollProgress > 0.1 && scrollProgress < 0.85;
        const intensity = isDark ? Math.sin(scrollProgress * Math.PI) * 0.04 : 0;
        ambientLight.color.setRGB(1.0 + intensity, 1.0, 1.0 - intensity * 0.3);
    }

    return { init, update };
})();
