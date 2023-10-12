#define PI 3.1415926535897932384626433832795

uniform sampler2D uTexture;
uniform sampler2D uDataTexture;
uniform vec2 uResolution;
uniform float uTime;

varying vec2 vUv;

void main() {
  vec2 uv = (vUv - 0.5) * uResolution + vec2(0.5);
  
  vec4 offset = texture2D(uDataTexture, vUv);

  // vec4 color = texture2D(uTexture, uv - offset);
  // color = texture2D(uDataTexture, vUv);

  gl_FragColor = texture2D(uTexture, uv - 0.002 * vec2(offset));
  // gl_FragColor = texture2D(uDataTexture, vUv);
}