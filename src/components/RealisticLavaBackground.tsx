import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export const RealisticLavaBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const emberCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = (canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      powerPreference: 'high-performance',
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
    }) || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;

    if (!gl) return;

    const vsSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        v_uv = (a_position + 1.0) * 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fsSource = `
      precision mediump float;
      uniform vec2 u_resolution;
      uniform float u_time;
      varying vec2 v_uv;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.52;
        vec2 shift = vec2(100.0);
        mat2 rot = mat2(cos(0.52), sin(0.52), -sin(0.52), cos(0.52));
        for (int i = 0; i < 3; ++i) {
          v += a * noise(p);
          p = rot * p * 2.05 + shift;
          a *= 0.48;
        }
        return v;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        vec2 p = uv * vec2(u_resolution.x / u_resolution.y, 1.0) * 1.8;

        float t = u_time * 0.08;
        vec2 flow = vec2(sin(t * 0.5) * 0.18, -t * 0.4);

        vec2 q = vec2(fbm(p + flow), fbm(p + flow + vec2(5.2, 1.3)));
        vec2 r = vec2(
          fbm(p + 2.8 * q + vec2(1.7, 9.2) + flow * 0.6),
          fbm(p + 2.8 * q + vec2(8.3, 2.8) + flow * 0.6)
        );

        float f = fbm(p + 3.0 * r);

        vec3 basalt = vec3(0.04, 0.03, 0.045);
        vec3 scorch = vec3(0.28, 0.04, 0.03);
        vec3 magmaRed = vec3(0.92, 0.12, 0.02);
        vec3 magmaOrange = vec3(1.0, 0.48, 0.05);
        vec3 magmaGold = vec3(1.0, 0.82, 0.28);
        vec3 whiteHot = vec3(1.0, 0.98, 0.85);

        vec3 col = basalt;

        col = mix(col, scorch, smoothstep(0.30, 0.48, f));
        col = mix(col, magmaRed, smoothstep(0.44, 0.65, f));
        col = mix(col, magmaOrange, smoothstep(0.60, 0.78, f));
        col = mix(col, magmaGold, smoothstep(0.75, 0.90, f));
        col = mix(col, whiteHot, smoothstep(0.88, 1.0, f));

        float pulse = sin(u_time * 0.9) * 0.08 + 0.96;
        col *= pulse;

        float heat = smoothstep(0.48, 0.95, f);
        col += vec3(0.4, 0.15, 0.02) * heat * 1.2;

        vec2 vigUv = (uv - 0.5) * 1.4;
        float vig = 1.0 - dot(vigUv, vigUv) * 0.35;
        vig = clamp(vig, 0.45, 1.0);
        col *= vig;

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    const createShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertShader = createShader(gl.VERTEX_SHADER, vsSource);
    const fragShader = createShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vertShader || !fragShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = new Float32Array([
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
      -1.0,  1.0,
       1.0, -1.0,
       1.0,  1.0,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const aPosition = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    const uResolution = gl.getUniformLocation(program, 'u_resolution');
    const uTime = gl.getUniformLocation(program, 'u_time');

    const resize = () => {
      const scale = 0.5;
      const width = Math.max(320, Math.floor(window.innerWidth * scale));
      const height = Math.max(240, Math.floor(window.innerHeight * scale));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });

    let animId: number;
    let startTime = performance.now();
    let isVisible = true;

    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const render = (time: number) => {
      if (isVisible) {
        const elapsed = (time - startTime) * 0.001;
        gl.uniform2f(uResolution, canvas.width, canvas.height);
        gl.uniform1f(uTime, elapsed);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      gl.deleteProgram(program);
      gl.deleteShader(vertShader);
      gl.deleteShader(fragShader);
      gl.deleteBuffer(positionBuffer);
    };
  }, []);

  useEffect(() => {
    const canvas = emberCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const onResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize, { passive: true });

    const EMBER_COUNT = 32;
    interface Ember {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      baseAlpha: number;
      pulseSpeed: number;
      pulseOffset: number;
      hue: number;
    }

    const embers: Ember[] = [];
    for (let i = 0; i < EMBER_COUNT; i++) {
      embers.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -Math.random() * 0.8 - 0.4,
        size: Math.random() * 2.2 + 0.8,
        baseAlpha: Math.random() * 0.5 + 0.3,
        pulseSpeed: Math.random() * 2 + 1,
        pulseOffset: Math.random() * Math.PI * 2,
        hue: Math.random() > 0.4 ? 25 : 45,
      });
    }

    let emberAnimId: number;
    let isTabVisible = true;
    const handleVis = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVis);

    let lastTime = performance.now();

    const renderEmbers = (now: number) => {
      const dt = Math.min((now - lastTime) * 0.001, 0.1);
      lastTime = now;

      if (isTabVisible) {
        ctx.clearRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'lighter';

        const t = now * 0.001;

        for (let i = 0; i < EMBER_COUNT; i++) {
          const e = embers[i];
          e.x += e.vx + Math.sin(t * 1.2 + e.pulseOffset) * 0.5;
          e.y += e.vy;

          if (e.y < -10) {
            e.y = height + 10;
            e.x = Math.random() * width;
          }
          if (e.x < -10) e.x = width + 10;
          if (e.x > width + 10) e.x = -10;

          const alpha = e.baseAlpha * (0.7 + 0.3 * Math.sin(t * e.pulseSpeed + e.pulseOffset));

          ctx.fillStyle = e.hue === 45
            ? `rgba(255, 215, 80, ${alpha})`
            : `rgba(255, 95, 20, ${alpha})`;
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.globalCompositeOperation = 'source-over';
      }

      emberAnimId = requestAnimationFrame(renderEmbers);
    };

    emberAnimId = requestAnimationFrame(renderEmbers);

    return () => {
      cancelAnimationFrame(emberAnimId);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', handleVis);
    };
  }, []);

  return createPortal(
    (
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden select-none"
        style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover opacity-100 contrast-125 brightness-80"
          style={{ willChange: 'transform', position: 'absolute', inset: 0, zIndex: 0 }}
        />

        <canvas
          ref={emberCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none opacity-100"
          style={{ filter: 'brightness(0.9) saturate(1.15)', position: 'absolute', inset: 0, zIndex: 0 }}
        />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.18),rgba(0,0,0,0.84)_60%,rgba(0,0,0,0.96)_100%)] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#03050a]/90 via-transparent to-[#03050a]/96 pointer-events-none" />

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[550px] bg-gradient-to-r from-red-600/10 via-orange-500/12 to-amber-600/10 rounded-full blur-[130px] pointer-events-none" />
      </div>
    ),
    document.body
  );
};
