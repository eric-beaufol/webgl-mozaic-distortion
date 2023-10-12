varying vec2 vUv;

vec3 getColor(float r, float g, float b) {

  vec3 color = vec3(
    r / 255.,
    g / 255.,
    b / 255.
  );

  return color;
}

void main() {

  // gradient
  // vec3 color1 = getColor(255., 255., 255.);
  // vec3 color2 = getColor(255., 0., 0.);
  // vec3 color3 = getColor(255., 255., 255.);
  // vec3 color4 = getColor(255., 0., 0.);
  
  vec3 color1 = getColor(250., 204., 34.);
  vec3 color2 = getColor(248., 54., 0.);
  vec3 color3 = getColor(121., 26., 0.);

  // 3 colors gradient
  vec3 finalColor = mix(color1, color2, vUv.x * 2.);
  finalColor = mix(finalColor, color3, max(0., vUv.x * 2. - 1.));

  // 4 colors gradient
  // vec3 finalColor = mix(color1, color2, clamp(vUv.x * 3., 0., 1.));
  // finalColor = mix(finalColor, color3, clamp(vUv.x * 3. - 1., 0., 1.));
  // finalColor = mix(finalColor, color4, clamp(vUv.x * 3. - 2., 0., 1.));

  gl_FragColor = vec4(finalColor, 1.);
}