import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
export { OrbitControls };

/** 地理坐标 */
export class GeoCoord {
  constructor(
    public readonly lat: number,
    public readonly lon: number,
  ) {
    if (lat < -90 || lat > 90) throw new Error(`Invalid latitude: ${lat}`);
    if (lon < -180 || lon > 180) throw new Error(`Invalid longitude: ${lon}`);
  }

  toVector3(radius: number): THREE.Vector3 {
    const phi = (90 - this.lat) * (Math.PI / 180);
    const theta = (this.lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(
      -(radius * Math.sin(phi) * Math.cos(theta)),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta),
    );
  }
}

/** 主题类型 */
export type ThemeType = 'bright' | 'tech';

/** 主题配置 */
export interface ThemeConfig {
  readonly type: ThemeType;
  readonly dotShader: { vertex: string; fragment: string };
  readonly lightConfig: { pointColor: number; pointIntensity: number; hemisphereColor: number; hemisphereIntensity: number };
  readonly buttonStroke: string;
  readonly sourceUrl: string;
}

/** 亮色主题 */
export const BRIGHT_THEME: ThemeConfig = {
  type: 'bright',
  dotShader: {
    vertex: `
      uniform float u_time;
      uniform float u_maxExtrusion;
      varying vec3 vNormal;
      void main() {
        vNormal = normal;
        vec3 pos = position;
        if(u_maxExtrusion > 1.0) pos.xyz = pos.xyz * u_maxExtrusion + sin(u_time);
        else pos.xyz = pos.xyz * u_maxExtrusion;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragment: `
      uniform float u_time;
      varying vec3 vNormal;
      vec3 colorA = vec3(1.0, 0.55, 0.1);
      vec3 colorB = vec3(1.0, 0.35, 0.65);
      vec3 colorC = vec3(0.55, 0.15, 0.95);
      vec3 colorD = vec3(0.25, 0.1, 0.75);
      void main() {
        vec3 color = vec3(0.0);
        float t = clamp((vNormal.y + 1.0) * 0.5, 0.0, 1.0);
        if (t < 0.33) color = mix(colorA, colorB, t / 0.33);
        else if (t < 0.66) color = mix(colorB, colorC, (t - 0.33) / 0.33);
        else color = mix(colorC, colorD, (t - 0.66) / 0.34);
        color *= 1.3;
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  },
  lightConfig: { pointColor: 0xffffff, pointIntensity: 3, hemisphereColor: 0xffffff, hemisphereIntensity: 1.5 },
  buttonStroke: '#333333',
  sourceUrl: 'https://github.com/felixzhu97/three-explore',
};

/** 科技主题 */
export const TECH_THEME: ThemeConfig = {
  type: 'tech',
  dotShader: {
    vertex: `
      uniform float u_time;
      uniform float u_maxExtrusion;
      void main() {
        vec3 pos = position;
        if(u_maxExtrusion > 1.0) pos.xyz = pos.xyz * u_maxExtrusion + sin(u_time);
        else pos.xyz = pos.xyz * u_maxExtrusion;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragment: `
      uniform float u_time;
      vec3 colorA = vec3(0.0, 0.8, 1.0);
      vec3 colorB = vec3(0.0, 0.4, 0.8);
      vec3 colorC = vec3(0.2, 1.0, 0.8);
      void main() {
        vec3 color = mix(colorA, colorB, abs(sin(u_time)));
        color = mix(color, colorC, abs(sin(u_time * 0.7 + 1.57)) * 0.3);
        color *= 1.2;
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  },
  lightConfig: { pointColor: 0x081b26, pointIntensity: 17, hemisphereColor: 0xffffff, hemisphereIntensity: 1.5 },
  buttonStroke: '#ffffff',
  sourceUrl: 'https://github.com/felixzhu97/threejs-globe-stripe',
};

/** 地球仪配置 */
export class GlobeConfig {
  constructor(
    // 球体配置
    public readonly sphereRadius = 19.5,
    public readonly dotRadius = 0.1,
    public readonly dotSegments = 5,
    public readonly dotDensity = 2.5,
    public readonly worldTextureUrl = '/img/world_alpha_mini.jpg',
    // 飞线配置
    public readonly tubeRadius = 0.05,
    public readonly radialSegments = 8,
    public readonly tubularSegments = 50,
    public readonly animationSpeed = 0.012,
    public readonly cycleDuration = 16.0,
    public readonly arcHeight = 0.1,
    public readonly minArcHeight = 3,
    // 控制器配置
    public readonly autoRotateSpeed = 1.2,
    public readonly minPolarAngle = Math.PI / 2 - 0.5,
    public readonly maxPolarAngle = Math.PI / 2 + 0.5,
    // 纹理路径
    public readonly arcTextureUrls = [
      '/img/arc-texture-1.png',
      '/img/arc-texture-2.png',
      '/img/arc-texture-3.png',
      '/img/arc-texture-4.png',
    ],
  ) {}

  // 加载纹理
  loadArcTextures(callback: (textures: (THREE.Texture | undefined)[]) => void): void {
    const loader = new THREE.TextureLoader();
    const textures: (THREE.Texture | undefined)[] = [];
    let loadedCount = 0;
    const checkComplete = () => {
      loadedCount++;
      if (loadedCount >= this.arcTextureUrls.length) callback(textures);
    };
    this.arcTextureUrls.forEach((url, i) => {
      loader.load(url, (t) => { textures[i] = t; checkComplete(); }, undefined, () => checkComplete());
    });
  }

  // 贝塞尔曲线点计算
  bezierCurvePoints(start: THREE.Vector3, end: THREE.Vector3, segments = 60): THREE.Vector3[] {
    const points: THREE.Vector3[] = [];
    const dist = start.distanceTo(end);
    const height = Math.max(dist * this.arcHeight, this.minArcHeight);
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const ctrl = mid.clone().normalize().multiplyScalar(dist + height);
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const s = t * t * (3 - 2 * t);
      points.push(new THREE.Vector3(
        (1-s)*(1-s)*start.x + 2*(1-s)*s*ctrl.x + s*s*end.x,
        (1-s)*(1-s)*start.y + 2*(1-s)*s*ctrl.y + s*s*end.y,
        (1-s)*(1-s)*start.z + 2*(1-s)*s*ctrl.z + s*s*end.z,
      ));
    }
    return points;
  }

  // 创建基础球体材质
  createBaseMaterial(type: 'bright' | 'tech'): THREE.Material {
    if (type === 'bright') {
      return new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 });
    }
    return new THREE.MeshStandardMaterial({ color: 0x0b2636, transparent: true, opacity: 0.85, metalness: 0.3, roughness: 0.7 });
  }

  // 创建点材质
  createDotMaterial(theme: ThemeConfig): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: { u_time: { value: 1.0 }, u_maxExtrusion: { value: 1.0 } },
      vertexShader: theme.dotShader.vertex,
      fragmentShader: theme.dotShader.fragment,
    });
  }

  // 添加光照
  addLights(scene: THREE.Scene, theme: ThemeConfig, lightPos?: THREE.Vector3): void {
    const point = new THREE.PointLight(theme.lightConfig.pointColor, theme.lightConfig.pointIntensity, 200);
    if (lightPos) point.position.copy(lightPos);
    scene.add(point);
    scene.add(new THREE.HemisphereLight(theme.lightConfig.hemisphereColor, theme.lightConfig.hemisphereIntensity));
  }
}

/** 配色方案 */
export class ColorScheme {
  constructor(private readonly colors: readonly THREE.Vector3[]) {}

  static bright() {
    return new ColorScheme([
      new THREE.Vector3(0.3, 0.8, 1.0),
      new THREE.Vector3(1.0, 0.5, 0.3),
      new THREE.Vector3(0.5, 1.0, 0.3),
      new THREE.Vector3(1.0, 0.3, 0.8),
      new THREE.Vector3(0.8, 0.8, 0.3),
      new THREE.Vector3(0.6, 0.3, 1.0),
    ]);
  }

  static tech() {
    return new ColorScheme([
      new THREE.Vector3(0.0, 0.8, 1.0),
      new THREE.Vector3(0.0, 0.4, 0.8),
      new THREE.Vector3(0.2, 1.0, 0.8),
      new THREE.Vector3(0.3, 0.6, 1.0),
      new THREE.Vector3(0.0, 0.9, 0.6),
      new THREE.Vector3(0.1, 0.5, 0.9),
    ]);
  }

  getColor(i: number) { return this.colors[i % this.colors.length]; }
}

/** 飞线路由 */
export class FlightRoute {
  constructor(public readonly start: GeoCoord, public readonly end: GeoCoord) {}
}

/** 默认飞线路由 */
export const DEFAULT_ROUTES: FlightRoute[] = [
  new FlightRoute(new GeoCoord(39.9042, 116.4074), new GeoCoord(40.7128, -74.006)),
  new FlightRoute(new GeoCoord(51.5074, -0.1278), new GeoCoord(35.6762, 139.6503)),
  new FlightRoute(new GeoCoord(-33.8688, 151.2093), new GeoCoord(34.0522, -118.2437)),
  new FlightRoute(new GeoCoord(48.8566, 2.3522), new GeoCoord(31.2304, 121.4737)),
  new FlightRoute(new GeoCoord(25.2048, 55.2708), new GeoCoord(1.3521, 103.8198)),
  new FlightRoute(new GeoCoord(-23.5505, -46.6333), new GeoCoord(-33.9249, 18.4241)),
];

/** 飞线实体 */
export class FlyingLine {
  static create(route: FlightRoute, color: THREE.Vector3, config: GlobeConfig, radius: number, arcTextures: (THREE.Texture | undefined)[], idx = 0) {
    const startPos = route.start.toVector3(radius);
    const endPos = route.end.toVector3(radius);
    const pathPoints = config.bezierCurvePoints(startPos, endPos, 50);
    const curve = new THREE.CatmullRomCurve3(pathPoints);

    const geo2 = new THREE.TubeGeometry(curve, config.tubularSegments, config.tubeRadius, config.radialSegments, false);
    const progresses: number[] = [];
    for (let i = 0; i < geo2.attributes.position.count; i++) {
      progresses.push(Math.floor(i / (config.radialSegments + 1)) / config.tubularSegments);
    }
    geo2.setAttribute('progress', new THREE.Float32BufferAttribute(progresses, 1));

    const phase = Math.random() * config.cycleDuration;
    const mat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, animationPhase: { value: phase }, color: { value: color }, brightness: { value: 1.0 }, arcTexture: { value: arcTextures[idx % arcTextures.length] } },
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    return new THREE.Mesh(geo2, mat);
  }

  static marker(coord: GeoCoord, color: THREE.Vector3, radius: number, size = 0.5) {
    const pos = coord.toVector3(radius);
    const geo2 = new THREE.PlaneGeometry(size, size);
    const tex = new THREE.TextureLoader().load('/img/disc_texture.png');
    const mat = new THREE.ShaderMaterial({
      uniforms: { color: { value: color }, discTexture: { value: tex } },
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform vec3 color; uniform sampler2D discTexture; varying vec2 vUv; void main() { vec4 c = texture2D(discTexture, vUv); if (c.a < 0.01) discard; gl_FragColor = vec4(color, c.a); }`,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo2, mat);
    mesh.position.copy(pos);
    const n = pos.clone().normalize();
    mesh.lookAt(pos.clone().add(n));
    return mesh;
  }
}

const VERTEX_SHADER = `
  attribute float progress;
  uniform float time;
  uniform float animationPhase;
  varying vec2 vUv;
  varying float vProgress;
  varying float vVisibility;
  varying float vAnimationProgress;
  varying float vAnimationPhase;
  
  void main() {
    vUv = uv;
    vProgress = progress;
    float cycleDuration = 4.0;
    float cycle = mod(time + animationPhase, cycleDuration);
    float visibility = 0.0;
    float animationProgress = 0.0;
    float phase = 0.0;
    
    if (cycle < 1.0) {
      animationProgress = cycle / 1.0;
      phase = 0.0;
      if (progress <= animationProgress) visibility = 1.0;
    } else if (cycle < 3.0) {
      animationProgress = 1.0;
      phase = 1.0;
      visibility = 1.0;
      float stayTime = cycle - 1.0;
      float pulse = 0.5 + 0.3 * sin(stayTime * 2.0 * 3.14159);
      float flowOffset = mod(stayTime * 1.5, 1.0);
      float flowGradient = 0.5 + 0.5 * sin((progress + flowOffset) * 6.28318);
      visibility *= (0.7 + pulse * 0.3 + flowGradient * 0.2);
    } else {
      animationProgress = (cycle - 3.0) / 1.0;
      phase = 2.0;
      if (progress >= animationProgress) visibility = 1.0;
    }
    
    vVisibility = visibility;
    vAnimationProgress = animationProgress;
    vAnimationPhase = phase;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  varying vec2 vUv;
  varying float vProgress;
  varying float vVisibility;
  varying float vAnimationProgress;
  varying float vAnimationPhase;
  uniform vec3 color;
  uniform float brightness;
  uniform sampler2D arcTexture;
  
  void main() {
    if (vVisibility < 0.01) discard;
    float radialDistance = abs(vUv.y - 0.5) * 2.0;
    float edgeFade = 1.0 - smoothstep(0.0, 1.0, radialDistance);
    gl_FragColor = vec4(color * brightness, vVisibility * edgeFade);
  }
`;

/** 地图点服务 */
export class LandMap {
  constructor(private readonly config: GlobeConfig) {}

  createDots(material: THREE.ShaderMaterial, scene: THREE.Scene): { materials: THREE.ShaderMaterial[], dots: THREE.Mesh[] } {
    const materials: THREE.ShaderMaterial[] = [];
    const dots: THREE.Mesh[] = [];

    const extractLand = (data: Uint8ClampedArray): Record<number, number[]> => {
      const land: Record<number, number[]> = {};
      for (let i = 0, lon = -180, lat = 90; i < data.length; i += 4, lon++) {
        if (!land[lat]) land[lat] = [];
        if (data[i] < 80 && data[i + 1] < 80 && data[i + 2] < 80) land[lat].push(lon);
        if (lon === 180) { lon = -180; lat--; }
      }
      return land;
    };

    const isOnLand = (lon: number, lat: number, land: Record<number, number[]>): boolean => {
      if (!land[lat]?.length) return false;
      const closest = land[lat].reduce((p, c) => Math.abs(c - lon) < Math.abs(p - lon) ? c : p);
      return Math.abs(lon - closest) < 0.5;
    };

    const toVec3 = (lon: number, lat: number): THREE.Vector3 => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        -(this.config.sphereRadius * Math.sin(phi) * Math.cos(theta)),
        this.config.sphereRadius * Math.cos(phi),
        this.config.sphereRadius * Math.sin(phi) * Math.sin(theta)
      );
    };

    const img = new Image();
    img.onload = () => {
      const cvs = document.createElement('canvas');
      cvs.width = img.width; cvs.height = img.height;
      const ctx = cvs.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const land = extractLand(ctx.getImageData(0, 0, cvs.width, cvs.height).data);
        for (let lat = 90, j = 0; lat > -90; lat--, j++) {
          const r = Math.cos(Math.abs(lat) * (Math.PI / 180)) * this.config.sphereRadius;
          const n = r * Math.PI * 2 * this.config.dotDensity;
          for (let x = 0; x < n; x++) {
            const lon = -180 + (x * 360) / n;
            if (!isOnLand(lon, lat, land)) continue;
            const v = toVec3(lon, lat);
            const geo = new THREE.CircleGeometry(this.config.dotRadius, this.config.dotSegments);
            geo.lookAt(v);
            geo.translate(v.x, v.y, v.z);
            const mat = material.clone();
            mat.uniforms.u_time.value = j * Math.sin(Math.random());
            materials.push(mat);
            const mesh = new THREE.Mesh(geo, mat);
            dots.push(mesh);
            scene.add(mesh);
          }
        }
      }
    };
    img.src = this.config.worldTextureUrl;

    return { materials, dots };
  }
}

/** 渲染循环服务 */
export class GlobeRenderer {
  private flyingMaterials: THREE.ShaderMaterial[] = [];
  private dotMaterials: THREE.ShaderMaterial[] = [];
  private twinkleSpeed = 0.03;
  private animId: number | null = null;

  constructor(
    private scene: THREE.Scene,
    private camera: THREE.Camera,
    private renderer: THREE.WebGLRenderer,
    private controls: OrbitControls,
    private config: GlobeConfig
  ) {}

  addFlyingLineMaterials(materials: THREE.ShaderMaterial[]): void {
    this.flyingMaterials = materials;
  }

  addDotMaterials(materials: THREE.ShaderMaterial[], twinkleSpeed: number): void {
    this.dotMaterials = materials;
    this.twinkleSpeed = twinkleSpeed;
  }

  start(): () => void {
    let time = 1.0;

    const render = () => {
      time += this.twinkleSpeed;
      this.dotMaterials.forEach(m => { m.uniforms.u_time.value += this.twinkleSpeed; });
      this.flyingMaterials.forEach(m => { m.uniforms.time.value += this.config.animationSpeed; });
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
      this.animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (this.animId !== null) {
        cancelAnimationFrame(this.animId);
        this.animId = null;
      }
    };
  }
}

/** 相机控制器工厂 */
export class GlobeControls {
  static create(camera: THREE.Camera, domElement: HTMLElement, config: GlobeConfig): OrbitControls {
    const controls = new OrbitControls(camera, domElement);
    controls.autoRotate = true;
    controls.autoRotateSpeed = config.autoRotateSpeed;
    controls.enableDamping = true;
    controls.enableRotate = true;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minPolarAngle = config.minPolarAngle;
    controls.maxPolarAngle = config.maxPolarAngle;
    return controls;
  }
}

/** 场景上下文 */
export interface SceneContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  dispose: () => void;
}

/** 场景工厂 - 封装场景/相机/渲染器初始化 */
export class GlobeScene {
  static create(container: HTMLElement, canvas: HTMLCanvasElement): SceneContext {
    const sizes = { width: container.offsetWidth, height: container.offsetHeight };
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, sizes.width / sizes.height, 1, 1000);
    camera.position.z = 100;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(sizes.width, sizes.height);

    const dispose = () => {
      renderer.dispose();
    };

    return { scene, camera, renderer, dispose };
  }
}

/** 交互回调接口 */
export interface GlobeInteractionCallbacks {
  onHover?: (hit: boolean) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

/** 交互事件接口 */
export interface GlobeInteraction {
  update: (callbacks: GlobeInteractionCallbacks) => void;
  dispose: () => void;
}

/** 交互服务 - 封装交互状态和事件处理 */
export class GlobeEvents {
  static create(
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    raycaster: THREE.Raycaster,
    baseMesh: THREE.Mesh
  ): { interaction: GlobeInteraction; state: { isIntersecting: boolean; grabbing: boolean } } {
    const state = { isIntersecting: false, grabbing: false };
    const mouse = new THREE.Vector2();
    const callbacks: GlobeInteractionCallbacks = {};

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObject(baseMesh);
      state.isIntersecting = !!hits[0];
      callbacks.onHover?.(state.isIntersecting);
    };

    const onResize = () => {
      const w = renderer.domElement.parentElement?.offsetWidth ?? window.innerWidth;
      const h = renderer.domElement.parentElement?.offsetHeight ?? window.innerHeight;
      camera.position.z = window.innerWidth > 700 ? 100 : 140;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const interaction: GlobeInteraction = {
      update(cbs) { Object.assign(callbacks, cbs); },
      dispose() {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mouseup', onMouseUp);
        window.removeEventListener('resize', onResize);
      },
    };

    const onMouseDown = () => callbacks.onDragStart?.();
    const onMouseUp = () => callbacks.onDragEnd?.();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('resize', onResize);

    return { interaction, state };
  }
}

/** 交互回调配置 */
export interface GlobeInteractionConfig {
  onHover?: (hit: boolean) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

/** 地球仪应用上下文 */
export interface GlobeAppContext {
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;
  readonly controls: OrbitControls;
  readonly interaction: GlobeInteraction;
  readonly state: { isIntersecting: boolean; grabbing: boolean };
  readonly materials: THREE.ShaderMaterial[];
  readonly flyingMaterials: THREE.ShaderMaterial[];
  readonly baseMesh: THREE.Mesh;
  dispose: () => void;
}

/** 地球仪应用工厂 */
export class GlobeApp {
  static create(
    container: HTMLElement,
    canvas: HTMLCanvasElement,
    config: GlobeConfig,
    colorScheme: ColorScheme,
    theme: ThemeConfig,
    lightPos?: THREE.Vector3,
    interactionConfig?: GlobeInteractionConfig
  ): GlobeAppContext {
    const ctx = GlobeScene.create(container, canvas);
    const controls = GlobeControls.create(ctx.camera, ctx.renderer.domElement, config);
    config.addLights(ctx.scene, theme, lightPos);

    const sphere = new THREE.SphereGeometry(config.sphereRadius, 35, 35);
    const baseMesh = new THREE.Mesh(sphere, config.createBaseMaterial(theme.type));
    ctx.scene.add(baseMesh);

    const dotMaterial = config.createDotMaterial(theme);
    const landMap = new LandMap(config);
    const { materials } = landMap.createDots(dotMaterial, ctx.scene);

    const flyingMaterials: THREE.ShaderMaterial[] = [];
    config.loadArcTextures((arcTextures) => {
      DEFAULT_ROUTES.forEach((route, i) => {
        const mesh = FlyingLine.create(route, colorScheme.getColor(i), config, config.sphereRadius, arcTextures, i);
        flyingMaterials.push(mesh.material as THREE.ShaderMaterial);
        ctx.scene.add(mesh);
        ctx.scene.add(FlyingLine.marker(route.start, colorScheme.getColor(i), config.sphereRadius));
        ctx.scene.add(FlyingLine.marker(route.end, colorScheme.getColor(i), config.sphereRadius));
      });
    });

    const renderer = new GlobeRenderer(ctx.scene, ctx.camera, ctx.renderer, controls, config);
    renderer.addFlyingLineMaterials(flyingMaterials);
    renderer.addDotMaterials(materials, 0.03);
    const stopRender = renderer.start();

    const { interaction, state } = GlobeEvents.create(ctx.camera, ctx.renderer, new THREE.Raycaster(), baseMesh);
    if (interactionConfig) interaction.update(interactionConfig);

    return {
      get scene() { return ctx.scene; },
      get camera() { return ctx.camera; },
      get renderer() { return ctx.renderer; },
      get controls() { return controls; },
      get interaction() { return interaction; },
      get state() { return state; },
      get materials() { return materials; },
      get flyingMaterials() { return flyingMaterials; },
      get baseMesh() { return baseMesh; },
      dispose() {
        stopRender();
        interaction.dispose();
        ctx.dispose();
      },
    };
  }
}
