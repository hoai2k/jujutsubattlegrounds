// Per-eye post stack. RenderPass -> (Bloom) -> Look -> (FXAA) -> Output.
// Built once per eye and re-configured when the quality tier changes: a tier
// that does not want a pass has it DISABLED (the composer skips it), and LOW
// never instantiates a composer at all — see stage.js.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { LookShader } from './passes/look.js';

export class EyePost {
  constructor(renderer, scene, camera) {
    const target = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, samples: 0 });
    this.composer = new EffectComposer(renderer, target);
    this.renderPass = new RenderPass(scene, camera);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.45, 0.4, 0.85);
    this.look = new ShaderPass(LookShader);
    this.fxaa = new ShaderPass(FXAAShader);
    this.output = new OutputPass();
    this.composer.addPass(this.renderPass);
    this.composer.addPass(this.bloom);
    this.composer.addPass(this.look);
    this.composer.addPass(this.fxaa);
    this.composer.addPass(this.output);
  }
  configure(tier) {
    this.bloom.enabled = !!tier.bloom;
    this.fxaa.enabled = !!tier.fxaa;
  }
  setSize(w, h, pr) {
    this.composer.setPixelRatio(pr);
    this.composer.setSize(w, h);
    this.bloom.setSize(w, h);
    this.look.uniforms.uResolution.value.set(w * pr, h * pr);
    this.fxaa.uniforms.resolution.value.set(1 / (w * pr), 1 / (h * pr));
  }
  render() { this.composer.renderToScreen = true; this.composer.render(); }
}
