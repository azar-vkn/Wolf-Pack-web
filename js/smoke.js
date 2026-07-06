// js/smoke.js

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('smokeCanvas');
    if (!canvas) return;

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
        console.warn("WebGL not supported, smoke effect disabled.");
        return;
    }

    // Determine scale for performance (mobile optimization)
    const getPixelRatio = () => {
        if (window.innerWidth < 768) {
            return Math.min(window.devicePixelRatio, 0.75); // Downscale significantly on mobile for 30-60FPS
        }
        return Math.min(window.devicePixelRatio, 1.25); // Cap at 1.25 for desktop to save GPU
    };

    let width, height;

    const resizeCanvas = () => {
        const dpr = getPixelRatio();
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        gl.viewport(0, 0, canvas.width, canvas.height);
    };

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(resizeCanvas, 100);
    });
    resizeCanvas();

    // Shader sources
    const vertexShaderSource = `
        attribute vec2 a_position;
        void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
        }
    `;

    const fragmentShaderSource = `
        precision highp float;
        
        uniform vec2 u_resolution;
        uniform float u_time;
        uniform vec2 u_mouse;

        // Hash function for noise
        float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        // 2D Value Noise
        float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
            
            return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
                       mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
        }

        // Fractional Brownian Motion
        float fbm(vec2 p) {
            float value = 0.0;
            float amplitude = 0.5;
            float frequency = 2.0;
            
            // Loop for octaves (4 for balance between performance and quality)
            for (int i = 0; i < 4; i++) {
                value += amplitude * noise(p * frequency);
                frequency *= 2.0;
                amplitude *= 0.5;
            }
            return value;
        }

        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution.xy;
            // Correct aspect ratio
            uv.x *= u_resolution.x / u_resolution.y;

            // Extremely slow time for luxury feel
            float time = u_time * 0.05;

            // Base coordinates for fbm
            vec2 p = uv * 2.0;
            
            // Add elegant, subtle mouse interaction (turbulence)
            vec2 mouseOffset = (u_mouse / u_resolution - 0.5) * 0.3;
            p -= mouseOffset;

            // Domain warping for smoke curls (multi-layered)
            vec2 q = vec2(0.0);
            q.x = fbm(p + vec2(0.0, time * 0.3));
            q.y = fbm(p + vec2(1.0, time * 0.4));

            vec2 r = vec2(0.0);
            r.x = fbm(p + 2.0 * q + vec2(1.7, 9.2) + 0.15 * time);
            r.y = fbm(p + 2.0 * q + vec2(8.3, 2.8) + 0.126 * time);

            float f = fbm(p + 3.0 * r);

            // Shape the smoke output
            // Soft contrast mapping
            f = smoothstep(0.1, 0.8, f);

            // Smoke color: soft light grey (CSS mix-blend-mode screen + opacity will handle the final look)
            vec3 color = vec3(f * 0.8 + 0.2);
            
            // Edge fading to make it look volumetric
            float edgeMask = 1.0 - smoothstep(0.0, 3.0, length(uv - vec2(0.5 * (u_resolution.x/u_resolution.y), 0.5)));
            
            gl_FragColor = vec4(color * edgeMask, f * edgeMask);
        }
    `;

    // Compile shader helper
    const compileShader = (type, source) => {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    };

    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Unable to initialize the shader program.");
        return;
    }
    
    gl.useProgram(program);

    // Geometry (Fullscreen Quad)
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
         1.0,  1.0
    ]), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const timeLocation = gl.getUniformLocation(program, "u_time");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const mouseLocation = gl.getUniformLocation(program, "u_mouse");

    // Mouse Interaction setup
    let targetMouse = { x: width / 2, y: height / 2 };
    let currentMouse = { x: width / 2, y: height / 2 };

    window.addEventListener('mousemove', (e) => {
        targetMouse.x = e.clientX;
        targetMouse.y = window.innerHeight - e.clientY; // Invert Y for WebGL
    });

    // Touch support for mobile interaction
    window.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            targetMouse.x = e.touches[0].clientX;
            targetMouse.y = window.innerHeight - e.touches[0].clientY;
        }
    }, { passive: true });

    let startTime = Date.now();

    // Render loop
    const render = () => {
        // Smooth mouse interpolation (lerp) for elegant interaction
        currentMouse.x += (targetMouse.x - currentMouse.x) * 0.01;
        currentMouse.y += (targetMouse.y - currentMouse.y) * 0.01;

        const time = (Date.now() - startTime) / 1000.0;

        gl.uniform1f(timeLocation, time);
        gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
        gl.uniform2f(mouseLocation, currentMouse.x, currentMouse.y);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
        requestAnimationFrame(render);
    };

    render();
});
