import * as THREE from 'three'

export const MorphShader = {
  uniforms: {
    uProgress: { value: 0.0 },
    uTime: { value: 0.0 },
    uMinY: { value: -1.0 },
    uMaxY: { value: 1.0 },
    uLayerPitch: { value: 0.012 }, // Normalized FDM layer height
    uResolution: { value: new THREE.Vector2(1920, 1080) },
  },

  vertexShader: /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vWorldNormal;
    varying vec3 vViewPosition;
    varying vec3 vWorldPosition;
    varying float vHeight;

    uniform float uMinY;
    uniform float uMaxY;

    void main() {
      // Screen & View space normals
      vNormal = normalize(normalMatrix * normal);
      
      // World position and normal
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);

      // View vector
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;

      // Normalized height along Y axis [0.0, 1.0]
      float denom = max(0.0001, uMaxY - uMinY);
      vHeight = clamp((position.y - uMinY) / denom, 0.0, 1.0);

      gl_Position = projectionMatrix * mvPosition;
    }
  `,

  fragmentShader: /* glsl */ `
    uniform float uProgress;
    uniform float uTime;
    uniform float uLayerPitch;
    uniform vec2 uResolution;

    varying vec3 vNormal;
    varying vec3 vWorldNormal;
    varying vec3 vViewPosition;
    varying vec3 vWorldPosition;
    varying float vHeight;

    // Fast pseudo-random hash
    float hash(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    // 2D value noise for carbon-fiber weave / micro-roughness
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    void main() {
      vec3 N = normalize(vNormal);
      vec3 V = normalize(vViewPosition);
      vec3 WN = normalize(vWorldNormal);

      // Edge detection using screen-space normal derivatives
      #if defined(GL_OES_standard_derivatives) || __VERSION__ >= 300
        vec3 dNx = dFdx(N);
        vec3 dNy = dFdy(N);
        float edgeStrength = length(dNx) + length(dNy);
      #else
        float edgeStrength = fwidth(N.z);
      #endif
      float edgeLine = smoothstep(0.12, 0.35, edgeStrength);

      // Fresnel rim factor
      float NdotV = clamp(dot(N, V), 0.0, 1.0);
      float fresnel = pow(1.0 - NdotV, 3.0);

      // Studio light vectors
      vec3 light1 = normalize(vec3(1.2, 2.0, 1.5));
      vec3 light2 = normalize(vec3(-1.5, -0.5, -1.0));
      vec3 light3 = normalize(vec3(0.0, 1.0, -2.0));

      // ----------------------------------------------------
      // STAGE 1: 2D Engineering Blueprint (0.0 <= uProgress < 0.33)
      // Deep blueprint blue with electric cyan line highlights & grid
      // ----------------------------------------------------
      vec3 bpBg = vec3(0.035, 0.09, 0.18);          // Deep navy blueprint base
      vec3 bpCyan = vec3(0.0, 0.824, 1.0);          // Electric cyan #00D2FF
      vec3 bpGlow = vec3(0.2, 0.6, 0.95);

      // Subtly visible blueprint grid on the object
      vec2 gridCoord = fract(vWorldPosition.xz * 12.0);
      float gridLine = step(0.94, gridCoord.x) + step(0.94, gridCoord.y);

      // Wireframe / curvature glow
      float wireGlow = max(edgeLine * 1.8, fresnel * 0.9);
      vec3 colBlueprint = mix(bpBg, bpCyan, clamp(wireGlow, 0.0, 1.0));
      colBlueprint += bpGlow * gridLine * 0.15;
      colBlueprint += bpCyan * pow(fresnel, 2.0) * 0.4;

      // ----------------------------------------------------
      // STAGE 2: SolidWorks CAD Viewport (0.33 <= uProgress < 0.66)
      // Matte studio clay/gray PBR with visible parametric topology
      // ----------------------------------------------------
      vec3 cadBase = vec3(0.54, 0.56, 0.60); // Neutral CAD studio gray #8A9099
      float diff1 = max(dot(N, light1), 0.0);
      float diff2 = max(dot(N, light2), 0.0) * 0.35;
      float diff3 = max(dot(N, light3), 0.0) * 0.2;

      // Blinn-Phong specular with roughness 0.35
      vec3 H1 = normalize(light1 + V);
      float spec = pow(max(dot(N, H1), 0.0), 28.0) * 0.45;

      vec3 colCAD = cadBase * (diff1 * 0.75 + diff2 + diff3 + 0.28) + vec3(spec);
      
      // Sharp CAD feature / parametric edge lines (darker graphite lines on edges)
      colCAD = mix(colCAD, vec3(0.12, 0.14, 0.16), clamp(edgeLine * 0.85, 0.0, 1.0));
      // Subtle edge sheen
      colCAD += vec3(0.9, 0.92, 0.95) * pow(fresnel, 4.0) * 0.3;

      // ----------------------------------------------------
      // STAGE 3: Industrial 3D Printed Part (0.66 <= uProgress <= 1.0)
      // Procedural FDM layer lines, micro-roughness for PA12-CF/PETG
      // ----------------------------------------------------
      vec3 printBase = vec3(0.08, 0.09, 0.10); // Amboss industrial carbon black
      
      // Procedural FDM layer lines: sinusoidal ridge pattern along vHeight
      float layerFreq = 1.0 / max(0.001, uLayerPitch);
      float layerWave = sin(vHeight * layerFreq * 6.2831853);
      float layerShade = 0.5 + 0.5 * layerWave;
      // Normal modulation along vertical axis gives micro-ribbing
      vec3 layerNormal = normalize(N + vec3(0.0, layerWave * 0.18, 0.0));

      // Carbon-fiber composite micro-texture (noise modulation)
      float cfNoise = noise(vWorldPosition.xy * 85.0) * noise(vWorldPosition.zy * 85.0);
      float fiberRoughness = mix(0.85, 1.15, cfNoise);

      float pDiff1 = max(dot(layerNormal, light1), 0.0);
      float pDiff2 = max(dot(layerNormal, light2), 0.0) * 0.25;
      
      // Anisotropic highlight sheen across layer ridges
      vec3 pH1 = normalize(light1 + V);
      float pSpec = pow(max(dot(layerNormal, pH1), 0.0), 16.0) * 0.25 * fiberRoughness;

      vec3 colPrint = printBase * (pDiff1 * 0.8 + pDiff2 + 0.22) * (0.88 + 0.24 * layerShade);
      colPrint += vec3(pSpec);
      // Subtle rim light catching layer peaks
      colPrint += vec3(0.15, 0.20, 0.26) * pow(fresnel, 2.5);

      // ----------------------------------------------------
      // STAGE INTERPOLATION
      // Smooth continuous blend across [0.0, 1.0]
      // ----------------------------------------------------
      // Stage weights with smoothstep cross-fading
      float p = clamp(uProgress, 0.0, 1.0);
      
      float w1 = smoothstep(0.42, 0.12, p);
      float w2 = smoothstep(0.12, 0.38, p) * smoothstep(0.78, 0.55, p);
      float w3 = smoothstep(0.55, 0.82, p);

      float totalW = w1 + w2 + w3 + 0.0001;
      vec3 finalColor = (colBlueprint * w1 + colCAD * w2 + colPrint * w3) / totalW;

      // Add a dynamic scanline / laser transition wave during morphing
      float wavePos = fract(p * 2.5);
      float scanline = smoothstep(0.03, 0.0, abs(vHeight - wavePos));
      vec3 laserColor = mix(bpCyan, vec3(0.2, 0.5, 0.9), p);
      finalColor += laserColor * scanline * 0.3 * smoothstep(0.05, 0.2, p) * smoothstep(0.95, 0.8, p);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
}
