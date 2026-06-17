/* ═══════════════════════════════════════════════════════════
   PARTICLES.JS — Subtle Floating Particle System
   Tiny dots, very minimal, ambient depth only
   ═══════════════════════════════════════════════════════════ */

const ParticleSystem = (() => {
    const COUNT = 30;
    const SPREAD = 5;

    let mesh = null;
    let positions = null;
    let seeds = [];
    let isInit = false;

    function init(scene) {
        const geo = new THREE.BufferGeometry();
        positions = new Float32Array(COUNT * 3);

        for (let i = 0; i < COUNT; i++) {
            const i3 = i * 3;
            positions[i3]     = (Math.random() - 0.5) * SPREAD;
            positions[i3 + 1] = (Math.random() - 0.5) * SPREAD * 0.5;
            // Place particles BEHIND the image plane (z < 0) so they never overlap
            positions[i3 + 2] = -(Math.random() * 2 + 0.5);

            seeds.push({
                phase: Math.random() * Math.PI * 2,
                speed: Math.random() * 0.3 + 0.2,
                drift: (Math.random() - 0.5) * 0.0005,
            });
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const mat = new THREE.PointsMaterial({
            color: 0xff6a00,
            size: 0.012,             // Very small — tiny dots
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true,
        });

        mesh = new THREE.Points(geo, mat);
        mesh.renderOrder = -1;       // Render behind the plane
        scene.add(mesh);
        isInit = true;
    }

    function update(time, scrollProgress) {
        if (!isInit) return;

        const t = time * 0.001;

        for (let i = 0; i < COUNT; i++) {
            const i3 = i * 3;
            const s = seeds[i];
            positions[i3]     += s.drift + Math.sin(t * s.speed + s.phase) * 0.0003;
            positions[i3 + 1] += 0.00015;

            if (positions[i3 + 1] > SPREAD * 0.25) positions[i3 + 1] = -SPREAD * 0.25;
            if (positions[i3] > SPREAD / 2) positions[i3] = -SPREAD / 2;
            if (positions[i3] < -SPREAD / 2) positions[i3] = SPREAD / 2;
        }

        mesh.geometry.attributes.position.needsUpdate = true;

        // Only show particles during dark middle sections
        const midIntensity = Math.sin(scrollProgress * Math.PI);
        mesh.material.opacity = midIntensity * 0.25;
    }

    return { init, update };
})();
