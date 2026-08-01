/* =========================================================
   NEON RACER ARCADE - JS ENGINE
   ========================================================= */

(function () {
    'use strict';

    // --- Web Audio API Synth for Racing ---
    class RacingSoundFX {
        constructor() {
            this.ctx = null;
            this.enabled = true;
        }

        init() {
            if (!this.ctx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) this.ctx = new AudioCtx();
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        }

        playNitro() {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(900, now + 0.3);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.3);
        }

        playPickup() {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(500, now);
            osc.frequency.exponentialRampToValueAtTime(1000, now + 0.15);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.15);
        }

        playCrash() {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(120, now);
            osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.4);
        }
    }

    const soundFX = new RacingSoundFX();

    // --- Game Variables ---
    let canvas, ctx;
    let viewportWidth = 0, viewportHeight = 0;

    let gameState = 'MENU'; // 'MENU', 'PLAYING', 'GAMEOVER'
    let selectedCar = 'red'; // 'red', 'truck', 'cyber'

    let roadScrollY = 0;
    let distanceTraveled = 0;
    let currentSpeed = 0; // km/h
    let targetSpeed = 80;

    let nitroPct = 100;
    let isNitroActive = false;

    // Dynamic Road Curve & Physics Variables
    let currentCurve = 0;
    let targetCurve = 0;
    let curveTimer = 0;

    let skidMarks = [];
    let speedLines = [];
    let roadsideScenery = [];
    let trafficLights = [];
    let spawnLightTimer = 0;

    // Player Car State
    let playerCar = {
        x: 0,
        y: 0,
        width: 50,
        height: 90,
        lane: 1, // 0, 1, 2
        targetX: 0,
        angle: 0,
        shieldTimer: 0,
        spinTimer: 0
    };

    // Entities
    let traffic = [];
    let items = [];
    let particles = [];

    let keys = {};

    function distance(x1, y1, x2, y2) {
        return Math.hypot(x2 - x1, y2 - y1);
    }

    function drawRoundRect(ctx, x, y, w, h, r) {
        if (ctx.roundRect) {
            ctx.roundRect(x, y, w, h, r);
        } else {
            ctx.rect(x, y, w, h);
        }
    }

    function getCurveOffset(y) {
        const progress = Math.sin((y / viewportHeight) * Math.PI);
        return progress * currentCurve * 110;
    }

    function showToast(msg) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
    }

    function getLaneX(laneIndex, y = viewportHeight - 140) {
        const roadWidth = Math.min(420, viewportWidth * 0.9);
        const roadCenter = (viewportWidth / 2) + getCurveOffset(y);
        const roadLeft = roadCenter - (roadWidth / 2);
        const laneWidth = roadWidth / 3;
        return roadLeft + laneWidth * laneIndex + laneWidth / 2;
    }

    function initRace() {
        distanceTraveled = 0;
        currentSpeed = 60;
        targetSpeed = 80;
        nitroPct = 100;
        isNitroActive = false;

        currentCurve = 0;
        targetCurve = 0;
        curveTimer = 0;

        playerCar.lane = 1;
        playerCar.x = getLaneX(1);
        playerCar.targetX = playerCar.x;
        playerCar.y = viewportHeight - 140;
        playerCar.angle = 0;
        playerCar.shieldTimer = 0;
        playerCar.spinTimer = 0;

        traffic = [];
        items = [];
        particles = [];
        skidMarks = [];
        speedLines = [];
        trafficLights = [];
        spawnLightTimer = 0;

        // Generate Roadside Scenery (Beach 🏖️, Ocean ⛵, Palm Trees 🌴, Green Trees 🌳🌲🌸)
        roadsideScenery = [];
        const natureIcons = ['🌴', '🌳', '🌲', '🏖️', '⛵', '🌴', '🌸', '🌴', '🌲', '🌳'];
        for (let i = 0; i < 24; i++) {
            roadsideScenery.push({
                y: i * 50,
                side: i % 2 === 0 ? -1 : 1, // -1: Ocean/Beach Left, 1: Forest Right
                type: natureIcons[Math.floor(Math.random() * natureIcons.length)]
            });
        }

        updateHUD();
    }

    function spawnTraffic() {
        const lane = Math.floor(Math.random() * 3);
        const models = ['sports', 'taxi', 'truck', 'bus', 'police', 'sedan'];
        const model = models[Math.floor(Math.random() * models.length)];

        let width = 46;
        let height = 85;
        let color = '#ff3366';

        if (model === 'sports') { color = '#ff007f'; width = 44; height = 82; }
        else if (model === 'taxi') { color = '#ffd700'; width = 46; height = 85; }
        else if (model === 'truck') { color = '#ff9900'; width = 52; height = 110; }
        else if (model === 'bus') { color = '#39ff14'; width = 54; height = 120; }
        else if (model === 'police') { color = '#0284c7'; width = 46; height = 85; }
        else if (model === 'sedan') { color = '#9d4edd'; width = 46; height = 85; }

        traffic.push({
            lane: lane,
            x: getLaneX(lane, -120),
            y: -120,
            width: width,
            height: height,
            speed: Math.random() * 1.8 + 2.5,
            color: color,
            model: model
        });
    }

    function spawnItem() {
        const lane = Math.floor(Math.random() * 3);
        const types = ['nitro', 'coin', 'shield', 'oil', 'block'];
        const type = types[Math.floor(Math.random() * types.length)];

        items.push({
            lane: lane,
            x: getLaneX(lane, -80),
            y: -80,
            radius: 18,
            type: type
        });
    }

    let spawnTrafficTimer = 0;
    let spawnItemTimer = 0;

    function updateRace(dt) {
        // Dynamic Road Curve Logic
        curveTimer += dt;
        if (curveTimer > 3500) {
            curveTimer = 0;
            targetCurve = (Math.random() - 0.5) * 2.2;
        }
        currentCurve += (targetCurve - currentCurve) * 0.02;

        // Nitro & Speed logic
        const maxNormalSpeed = 120;
        const maxNitroSpeed = selectedCar === 'red' ? 240 : 200;

        if ((keys[' '] || keys['ArrowUp'] || keys['w'] || keys['W'] || isNitroActive) && nitroPct > 0) {
            targetSpeed = maxNitroSpeed;
            nitroPct = Math.max(0, nitroPct - dt * 0.04);
            if (!isNitroActive) {
                soundFX.playNitro();
                isNitroActive = true;
            }
            particles.push({
                x: playerCar.x + (Math.random() - 0.5) * 20,
                y: playerCar.y + 40,
                vx: (Math.random() - 0.5) * 2,
                vy: Math.random() * 4 + 4,
                radius: Math.random() * 5 + 3,
                color: '#ff6b00',
                life: 0.2
            });
        } else {
            isNitroActive = false;
            targetSpeed = maxNormalSpeed;
            const rechargeRate = selectedCar === 'cyber' ? 0.03 : 0.015;
            nitroPct = Math.min(100, nitroPct + dt * rechargeRate);
        }

        currentSpeed += (targetSpeed - currentSpeed) * 0.05;
        distanceTraveled += (currentSpeed / 3600) * (dt / 1000) * 10000;

        const scrollSpeed = currentSpeed * 0.15;
        roadScrollY += scrollSpeed;

        roadsideScenery.forEach(s => {
            s.y += scrollSpeed * 0.8;
            if (s.y > viewportHeight + 100) {
                s.y = -100;
                s.type = Math.random() < 0.6 ? '🌴' : '🌆';
            }
        });

        // Steering Logic & Car Angle Tilting
        playerCar.targetX = getLaneX(playerCar.lane, playerCar.y);
        const steerDiff = playerCar.targetX - playerCar.x;
        playerCar.x += steerDiff * 0.2;

        const targetAngle = (steerDiff * 0.006) + (currentCurve * 0.08);
        playerCar.angle += (targetAngle - playerCar.angle) * 0.2;

        // Skid marks on sharp turns
        if (Math.abs(steerDiff) > 12) {
            skidMarks.push({
                x: playerCar.x,
                y: playerCar.y + 35,
                angle: playerCar.angle,
                life: 1.0
            });
        }
        for (let i = skidMarks.length - 1; i >= 0; i--) {
            skidMarks[i].y += scrollSpeed;
            skidMarks[i].life -= dt / 1000;
            if (skidMarks[i].life <= 0 || skidMarks[i].y > viewportHeight + 100) {
                skidMarks.splice(i, 1);
            }
        }

        // Spawn Traffic Light Gantries Periodically (Every 11s)
        spawnLightTimer += dt;
        if (spawnLightTimer > 11000) {
            spawnLightTimer = 0;
            trafficLights.push({
                y: -150,
                lightState: 'green',
                timer: 0,
                passed: false
            });
        }

        // Update Traffic Lights
        for (let i = trafficLights.length - 1; i >= 0; i--) {
            const tl = trafficLights[i];
            tl.y += scrollSpeed;
            tl.timer += dt;

            // Light state cycle: Green (3s) -> Yellow (1.5s) -> Red (3.5s)
            if (tl.timer < 3000) tl.lightState = 'green';
            else if (tl.timer < 4500) tl.lightState = 'yellow';
            else tl.lightState = 'red';

            // Check passing line logic
            if (!tl.passed && tl.y >= playerCar.y - 20) {
                tl.passed = true;
                if (tl.lightState === 'red') {
                    if (currentSpeed > 50) {
                        soundFX.playCrash();
                        showToast('🚨 RAN A RED LIGHT! THE POLICE SPIN YOU OUT!');
                        playerCar.spinTimer = 800;
                    } else {
                        soundFX.playPickup();
                        distanceTraveled += 100;
                        showToast('🟢 SAFE STOP AT THE RED LIGHT! BONUS +100m!');
                    }
                } else if (tl.lightState === 'green') {
                    showToast('🟢 GREEN LIGHT: GO GO GO!');
                }
            }

            if (tl.y > viewportHeight + 150) {
                trafficLights.splice(i, 1);
            }
        }

        // Spawn Traffic & Items
        spawnTrafficTimer += dt;
        if (spawnTrafficTimer > 1200 - Math.min(600, currentSpeed * 3)) {
            spawnTrafficTimer = 0;
            spawnTraffic();
        }

        spawnItemTimer += dt;
        if (spawnItemTimer > 1500) {
            spawnItemTimer = 0;
            spawnItem();
        }

        // Update Traffic Cars (Stay inside curved lane!)
        for (let i = traffic.length - 1; i >= 0; i--) {
            const car = traffic[i];
            car.y += (currentSpeed * 0.08) - car.speed;
            car.x = getLaneX(car.lane, car.y); // Keep car in lane along curve!

            if (car.y > viewportHeight + 150) {
                traffic.splice(i, 1);
                continue;
            }

            if (Math.abs(car.x - playerCar.x) < (car.width + playerCar.width) * 0.45 &&
                Math.abs(car.y - playerCar.y) < (car.height + playerCar.height) * 0.45) {
                if (playerCar.shieldTimer > 0 || selectedCar === 'truck') {
                    soundFX.playCrash();
                    traffic.splice(i, 1);
                    showToast('💥 SMASHED THAT RECKLESS DRIVER AWAY!');
                } else {
                    soundFX.playCrash();
                    endRace();
                    return;
                }
            }
        }

        // Update Items & Hazards (Stay inside curved lane!)
        for (let i = items.length - 1; i >= 0; i--) {
            const item = items[i];
            item.y += currentSpeed * 0.08;
            item.x = getLaneX(item.lane, item.y); // Keep item in lane along curve!

            if (item.y > viewportHeight + 100) {
                items.splice(i, 1);
                continue;
            }

            if (distance(playerCar.x, playerCar.y, item.x, item.y) < item.radius + 25) {
                soundFX.playPickup();
                if (item.type === 'nitro') {
                    nitroPct = Math.min(100, nitroPct + 50);
                    showToast('🚀 NITRO REFILLED BY 50%!');
                } else if (item.type === 'coin') {
                    distanceTraveled += 50;
                    showToast('🪙 BONUS +50m DISTANCE!');
                } else if (item.type === 'shield') {
                    playerCar.shieldTimer = 5000;
                    showToast('🛡️ CAR SHIELD ACTIVATED!');
                } else if (item.type === 'oil') {
                    if (selectedCar !== 'truck' && playerCar.shieldTimer <= 0) {
                        playerCar.spinTimer = 800;
                        showToast('🌀 SLIPPERY OIL! SPINNING OUT!');
                    }
                } else if (item.type === 'block') {
                    if (playerCar.shieldTimer <= 0) {
                        soundFX.playCrash();
                        endRace();
                        return;
                    }
                }
                items.splice(i, 1);
            }
        }

        // Update Particles
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].x += particles[i].vx;
            particles[i].y += particles[i].vy;
            particles[i].life -= dt / 1000;
            if (particles[i].life <= 0) particles.splice(i, 1);
        }

        updateHUD();
    }

    function endRace() {
        gameState = 'GAMEOVER';
        document.getElementById('end-dist').textContent = `${Math.floor(distanceTraveled)}m`;
        document.getElementById('modal-end').classList.add('active');
    }

    function updateHUD() {
        document.getElementById('speed-val').textContent = Math.floor(currentSpeed);
        document.getElementById('score-val').textContent = `${Math.floor(distanceTraveled)}m`;
        document.getElementById('nitro-fill').style.width = `${nitroPct}%`;
        document.getElementById('nitro-text').textContent = `${Math.floor(nitroPct)}%`;
    }

    function drawRace() {
        ctx.clearRect(0, 0, viewportWidth, viewportHeight);

        const roadWidth = Math.min(420, viewportWidth * 0.9);

        // 1. Draw Sunset Sky & Mountain Horizon Background ⛰️☀️
        const skyGrad = ctx.createLinearGradient(0, 0, 0, viewportHeight * 0.4);
        skyGrad.addColorStop(0, '#0f172a');
        skyGrad.addColorStop(0.5, '#7c3aed');
        skyGrad.addColorStop(1, '#f97316');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, viewportWidth, viewportHeight);

        // Sun ☀️ glowing over mountains
        ctx.save();
        ctx.beginPath();
        ctx.arc(viewportWidth * 0.5, 90, 45, 0, Math.PI * 2);
        ctx.fillStyle = '#fef08a';
        ctx.shadowColor = '#fef08a';
        ctx.shadowBlur = 30;
        ctx.fill();
        ctx.restore();

        // Mountain Silhouettes ⛰️
        ctx.fillStyle = '#2e1065';
        ctx.beginPath();
        ctx.moveTo(0, 180);
        ctx.lineTo(viewportWidth * 0.15, 110);
        ctx.lineTo(viewportWidth * 0.35, 170);
        ctx.lineTo(viewportWidth * 0.55, 95);
        ctx.lineTo(viewportWidth * 0.75, 160);
        ctx.lineTo(viewportWidth * 0.9, 120);
        ctx.lineTo(viewportWidth, 180);
        ctx.lineTo(viewportWidth, viewportHeight);
        ctx.lineTo(0, viewportHeight);
        ctx.fill();

        // 2. Draw Left Ocean 🌊, Golden Beach 🏖️ & Right Forest Grass 🌲 Slice-by-Slice
        const sliceH = 10;
        for (let y = 0; y < viewportHeight; y += sliceH) {
            const curveOffset = getCurveOffset(y);
            const roadCenter = (viewportWidth / 2) + curveOffset;
            const roadLeft = roadCenter - (roadWidth / 2);
            const roadRight = roadCenter + (roadWidth / 2);

            // Left Side: Blue Ocean 🌊 & Golden Beach Sand 🏖️
            ctx.fillStyle = '#0284c7'; // Ocean Blue
            ctx.fillRect(0, y, roadLeft - 40, sliceH);

            ctx.fillStyle = '#fde047'; // Beach Sand
            ctx.fillRect(roadLeft - 40, y, 40, sliceH);

            // Right Side: Lush Forest Green Grass 🌳
            ctx.fillStyle = '#15803d'; // Forest Green Grass
            ctx.fillRect(roadRight, y, viewportWidth - roadRight, sliceH);

            // Red/White Curb Stripes
            const stripeIndex = Math.floor((y + roadScrollY) / 20) % 2;
            ctx.fillStyle = stripeIndex === 0 ? '#ef4444' : '#ffffff';
            ctx.fillRect(roadLeft - 8, y, 8, sliceH);
            ctx.fillRect(roadRight, y, 8, sliceH);

            // Asphalt Road Base
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(roadLeft, y, roadWidth, sliceH);
        }

        // 3. Draw Neon Glowing Outer Lines
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 5;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        for (let y = 0; y <= viewportHeight; y += 20) {
            const curveOffset = getCurveOffset(y);
            const roadLeft = (viewportWidth / 2) + curveOffset - (roadWidth / 2);
            if (y === 0) ctx.moveTo(roadLeft, y);
            else ctx.lineTo(roadLeft, y);
        }
        ctx.stroke();

        ctx.beginPath();
        for (let y = 0; y <= viewportHeight; y += 20) {
            const curveOffset = getCurveOffset(y);
            const roadLeft = (viewportWidth / 2) + curveOffset - (roadWidth / 2);
            if (y === 0) ctx.moveTo(roadLeft + roadWidth, y);
            else ctx.lineTo(roadLeft + roadWidth, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // 4. Draw Dashed Lane Lines
        const laneWidth = roadWidth / 3;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 3;
        ctx.setLineDash([25, 25]);
        ctx.lineDashOffset = -roadScrollY % 50;

        for (let laneIdx = 1; laneIdx <= 2; laneIdx++) {
            ctx.beginPath();
            for (let y = 0; y <= viewportHeight; y += 20) {
                const curveOffset = getCurveOffset(y);
                const roadLeft = (viewportWidth / 2) + curveOffset - (roadWidth / 2);
                const lx = roadLeft + laneWidth * laneIdx;
                if (y === 0) ctx.moveTo(lx, y);
                else ctx.lineTo(lx, y);
            }
            ctx.stroke();
        }
        ctx.setLineDash([]);

        // 5. Draw Nature Scenery (Beach 🏖️, Ocean ⛵, Palm Trees 🌴, Forest 🌳🌲🌸)
        roadsideScenery.forEach(s => {
            const curveOffset = getCurveOffset(s.y);
            const roadCenter = (viewportWidth / 2) + curveOffset;
            const sx = s.side === -1 ? (roadCenter - roadWidth / 2 - 45) : (roadCenter + roadWidth / 2 + 45);

            ctx.font = '28px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(s.type, sx, s.y);
        });

        // 6. Draw Overhead Traffic Light Gantries 🚦
        trafficLights.forEach(tl => {
            const curveOffset = getCurveOffset(tl.y);
            const roadCenter = (viewportWidth / 2) + curveOffset;

            ctx.save();
            ctx.translate(roadCenter, tl.y);

            // Overhead Beam
            ctx.fillStyle = '#334155';
            ctx.fillRect(-roadWidth / 2 - 15, -10, roadWidth + 30, 12);

            // Stop Line on Road
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.fillRect(-roadWidth / 2, 25, roadWidth, 8);

            // Traffic Light Box
            ctx.fillStyle = '#0f172a';
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2;
            ctx.fillRect(-45, -28, 90, 28);
            ctx.strokeRect(-45, -28, 90, 28);

            const isRed = tl.lightState === 'red';
            const isYellow = tl.lightState === 'yellow';
            const isGreen = tl.lightState === 'green';

            // Red Lamp 🔴
            ctx.beginPath();
            ctx.arc(-26, -14, 8, 0, Math.PI * 2);
            ctx.fillStyle = isRed ? '#ef4444' : '#450a0a';
            ctx.shadowColor = isRed ? '#ef4444' : 'transparent';
            ctx.shadowBlur = isRed ? 18 : 0;
            ctx.fill();

            // Yellow Lamp 🟡
            ctx.beginPath();
            ctx.arc(0, -14, 8, 0, Math.PI * 2);
            ctx.fillStyle = isYellow ? '#eab308' : '#422006';
            ctx.shadowColor = isYellow ? '#eab308' : 'transparent';
            ctx.shadowBlur = isYellow ? 18 : 0;
            ctx.fill();

            // Green Lamp 🟢
            ctx.beginPath();
            ctx.arc(26, -14, 8, 0, Math.PI * 2);
            ctx.fillStyle = isGreen ? '#22c55e' : '#052e16';
            ctx.shadowColor = isGreen ? '#22c55e' : 'transparent';
            ctx.shadowBlur = isGreen ? 18 : 0;
            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.restore();
        });

        // 5. Draw Skid Marks
        skidMarks.forEach(s => {
            ctx.save();
            ctx.translate(s.x, s.y);
            ctx.rotate(s.angle);
            ctx.fillStyle = `rgba(0, 0, 0, ${s.life * 0.4})`;
            ctx.fillRect(-18, -4, 8, 12);
            ctx.fillRect(10, -4, 8, 12);
            ctx.restore();
        });

        // 6. Draw Items & Hazards
        items.forEach(item => {
            ctx.save();
            ctx.translate(item.x, item.y);
            ctx.beginPath();
            ctx.arc(0, 0, item.radius, 0, Math.PI * 2);

            let color = '#ffd700';
            let symbol = '🪙';
            if (item.type === 'nitro') { color = '#ff6b00'; symbol = '🚀'; }
            if (item.type === 'shield') { color = '#00f0ff'; symbol = '🛡️'; }
            if (item.type === 'oil') { color = '#475569'; symbol = '🛢️'; }
            if (item.type === 'block') { color = '#ef4444'; symbol = '🚧'; }

            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#fff';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(symbol, 0, 1);
            ctx.restore();
        });

        // 7. Draw Traffic Cars (Unique Shapes per Model)
        traffic.forEach(car => {
            ctx.save();
            ctx.translate(car.x, car.y);

            ctx.fillStyle = car.color;
            ctx.shadowColor = car.color;
            ctx.shadowBlur = 8;

            ctx.beginPath();
            drawRoundRect(ctx, -car.width / 2, -car.height / 2, car.width, car.height, 10);
            ctx.fill();

            // Windshield / Glass
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(-car.width * 0.35, -car.height * 0.2, car.width * 0.7, car.height * 0.25);

            // Specific Model Shapes & Details
            if (car.model === 'taxi') {
                // Black & Yellow Taxi Roof Sign
                ctx.fillStyle = '#000';
                ctx.fillRect(-12, -6, 24, 12);
                ctx.fillStyle = '#ffd700';
                ctx.font = 'bold 9px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('TAXI', 0, 0);
            } else if (car.model === 'truck') {
                // Truck Cargo Box Lines
                ctx.strokeStyle = 'rgba(255,255,255,0.4)';
                ctx.lineWidth = 2;
                ctx.strokeRect(-car.width * 0.4, -car.height * 0.45, car.width * 0.8, car.height * 0.5);
            } else if (car.model === 'bus') {
                // Bus Side Windows
                ctx.fillStyle = '#38bdf8';
                ctx.fillRect(-car.width * 0.4, -car.height * 0.4, 6, car.height * 0.7);
                ctx.fillRect(car.width * 0.4 - 6, -car.height * 0.4, 6, car.height * 0.7);
            } else if (car.model === 'sports') {
                // Racing Wings / Spoiler
                ctx.fillStyle = '#ff007f';
                ctx.fillRect(-car.width * 0.45, car.height * 0.4, car.width * 0.9, 6);
            } else if (car.model === 'police') {
                // Flashing Police Siren Bar 🚔
                const flash = Math.floor(Date.now() / 150) % 2 === 0;
                ctx.fillStyle = flash ? '#ef4444' : '#3b82f6';
                ctx.fillRect(-10, -4, 8, 8);
                ctx.fillStyle = flash ? '#3b82f6' : '#ef4444';
                ctx.fillRect(2, -4, 8, 8);
            }

            ctx.shadowBlur = 0;
            ctx.restore();
        });

        // 8. Draw Particles & Speed Lines
        particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.life / 0.2);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            ctx.restore();
        });

        // 9. Draw Player Car with Steering Angle Tilt
        ctx.save();
        ctx.translate(playerCar.x, playerCar.y);

        if (playerCar.spinTimer > 0) {
            ctx.rotate(Date.now() * 0.02);
        } else {
            ctx.rotate(playerCar.angle);
        }

        // Shield Glow
        if (playerCar.shieldTimer > 0) {
            ctx.beginPath();
            ctx.arc(0, 0, 42, 0, Math.PI * 2);
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 4;
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 20;
            ctx.stroke();
        }

        // Car Body Color
        let pColor = '#ff007f';
        if (selectedCar === 'truck') pColor = '#39ff14';
        if (selectedCar === 'cyber') pColor = '#00f0ff';

        ctx.fillStyle = pColor;
        ctx.shadowColor = pColor;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        drawRoundRect(ctx, -playerCar.width / 2, -playerCar.height / 2, playerCar.width, playerCar.height, 12);
        ctx.fill();

        // Windshield & Roof
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-playerCar.width * 0.35, -playerCar.height * 0.2, playerCar.width * 0.7, playerCar.height * 0.3);

        // Headlights
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 10;
        ctx.fillRect(-playerCar.width * 0.4, -playerCar.height * 0.5 - 2, 8, 4);
        ctx.fillRect(playerCar.width * 0.4 - 8, -playerCar.height * 0.5 - 2, 8, 4);

        ctx.restore();
    }

    let lastTime = 0;
    function gameLoop(timestamp) {
        const dt = lastTime ? Math.min(100, timestamp - lastTime) : 16;
        lastTime = timestamp;

        try {
            if (gameState === 'PLAYING') {
                updateRace(dt);
            }
            drawRace();
        } catch (err) {
            console.error("Racer loop error:", err);
        }

        requestAnimationFrame(gameLoop);
    }

    function setupEventListeners() {
        window.addEventListener('resize', resizeCanvas);

        window.addEventListener('keydown', e => {
            keys[e.key] = true;
            soundFX.init();

            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'a', 'A', 'd', 'D', 'w', 'W'].includes(e.key)) {
                if (gameState === 'PLAYING') e.preventDefault();
            }

            if (gameState === 'PLAYING') {
                if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                    playerCar.lane = Math.max(0, playerCar.lane - 1);
                }
                if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                    playerCar.lane = Math.min(2, playerCar.lane + 1);
                }
            }
        });

        window.addEventListener('keyup', e => {
            keys[e.key] = false;
        });

        window.addEventListener('blur', () => {
            keys = {};
        });

        // Car Select Buttons
        document.querySelectorAll('.car-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.car-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                selectedCar = card.dataset.car;
            });
        });

        // Start Race
        document.getElementById('btn-start-race')?.addEventListener('click', () => {
            document.getElementById('modal-start').classList.remove('active');
            gameState = 'PLAYING';
            initRace();
        });

        // Restart / Menu
        document.getElementById('btn-restart-race')?.addEventListener('click', () => {
            document.getElementById('modal-end').classList.remove('active');
            gameState = 'PLAYING';
            initRace();
        });

        document.getElementById('btn-menu-race')?.addEventListener('click', () => {
            document.getElementById('modal-end').classList.remove('active');
            document.getElementById('modal-start').classList.add('active');
            gameState = 'MENU';
        });

        // Nút Âm Thanh — nút này có sẵn trên thanh nav nhưng chưa bao giờ được
        // nối vào đâu, bấm không có tác dụng gì. Cùng cách làm với các game khác.
        const btnSound = document.getElementById('btn-sound');
        if (btnSound) {
            btnSound.addEventListener('click', () => {
                soundFX.enabled = !soundFX.enabled;
                // Lần bấm đầu tiên cũng là cử chỉ người dùng để mở khoá
                // AudioContext trên trình duyệt di động.
                if (soundFX.enabled) soundFX.init();
                const icon = document.getElementById('sound-icon');
                if (icon) icon.className = soundFX.enabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
                btnSound.classList.toggle('muted', !soundFX.enabled);
            });
        }

        // Touch Controls
        const btnLeft = document.getElementById('btn-left');
        const btnRight = document.getElementById('btn-right');
        const btnNitro = document.getElementById('btn-nitro');

        if (btnLeft) {
            btnLeft.addEventListener('touchstart', e => {
                e.preventDefault();
                playerCar.lane = Math.max(0, playerCar.lane - 1);
            });
        }
        if (btnRight) {
            btnRight.addEventListener('touchstart', e => {
                e.preventDefault();
                playerCar.lane = Math.min(2, playerCar.lane + 1);
            });
        }
        if (btnNitro) {
            btnNitro.addEventListener('touchstart', e => {
                e.preventDefault();
                isNitroActive = true;
            });
            btnNitro.addEventListener('touchend', () => isNitroActive = false);
        }
    }

    function resizeCanvas() {
        // Đo theo khung chứa thật thay vì trừ cứng 60px chiều cao thanh nav —
        // header/footer đổi kích thước là canvas lệch khỏi khung ngay.
        const box = canvas && canvas.parentElement;
        viewportWidth = box ? box.clientWidth : window.innerWidth;
        viewportHeight = box ? box.clientHeight : window.innerHeight;
        if (canvas) {
            canvas.width = viewportWidth;
            canvas.height = viewportHeight;
        }
    }

    window.addEventListener('DOMContentLoaded', () => {
        canvas = document.getElementById('game-canvas');
        ctx = canvas.getContext('2d');
        resizeCanvas();
        setupEventListeners();
        requestAnimationFrame(gameLoop);
    });

})();
