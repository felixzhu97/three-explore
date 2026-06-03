import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import * as THREE from 'three';
import { GlobeConfig, ColorScheme, GlobeApp, GlobeAppContext, TECH_THEME } from '../domain';

export default function Globe() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let app: GlobeAppContext;
    let mouseDown = false;
    let minMouseDownFlag = false;

    app = GlobeApp.create(container, canvas, new GlobeConfig(), ColorScheme.tech(), TECH_THEME, new THREE.Vector3(-50, 0, 60), {
      onHover(hit) {
        document.body.style.cursor = app.state.grabbing ? 'grabbing' : (hit ? 'pointer' : 'default');
      },
      onDragStart() {
        if (!app.state.isIntersecting) return;
        app.materials.forEach(m => gsap.to(m.uniforms.u_maxExtrusion, { value: 1.01 }));
        mouseDown = true;
        minMouseDownFlag = false;
        setTimeout(() => {
          minMouseDownFlag = true;
          if (!mouseDown) {
            app.materials.forEach(m => gsap.to(m.uniforms.u_maxExtrusion, { value: 1.0, duration: 0.15 }));
            app.state.grabbing = false;
            document.body.style.cursor = app.state.isIntersecting ? 'pointer' : 'default';
          }
        }, 500);
        document.body.style.cursor = 'grabbing';
        app.state.grabbing = true;
      },
      onDragEnd() {
        mouseDown = false;
        if (!minMouseDownFlag) return;
        app.materials.forEach(m => gsap.to(m.uniforms.u_maxExtrusion, { value: 1.0, duration: 0.15 }));
        app.state.grabbing = false;
        document.body.style.cursor = app.state.isIntersecting ? 'pointer' : 'default';
      },
    });

    return () => app.dispose();
  }, []);

  return (
    <div className="globe-container" ref={containerRef}>
      <canvas className="globe-canvas" ref={canvasRef} />
      <button className="source_btn" onClick={() => window.open(TECH_THEME.sourceUrl, '_blank')}>
        <svg width="25px" viewBox="0 0 24 24" fill="none" stroke={TECH_THEME.buttonStroke}>
          <path d="M15 7L20 12L15 17M9 17L4 12L9 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}
