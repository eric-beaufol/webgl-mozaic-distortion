import './style.css'
import * as THREE from 'three'
import * as dat from 'lil-gui'
import planeFragment from './shaders/plane/fragment.glsl'
import planeVertex from './shaders/plane/vertex.glsl'
import Stats from 'stats.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import gsap from 'gsap'

/**
 * Base
 */

// Constants
const MOUSE = {
  x: 0,
  y: 0,
  prevX: 0,
  prevY: 0,
  vX: 0,
  vY: 0
}

// Debug
const params = {
  distortionLevel: 200,
  restoreSpeed: 0.95,
  mousemoveFadeOut: 0.9,
  maxDist: 12,
  gridDimension: 64
}

// Stats
const stats = new Stats()
document.body.appendChild(stats.dom)

// canvas
const canvas = document.querySelector('canvas.webgl')

// Scenes
const scene = new THREE.Scene()

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

/**
 * Render target
 */


/**
 * Camera
 */
// Base camera
const { width, height } = sizes
const camera = new THREE.OrthographicCamera(-width/2, width/2, height/2, -height/2, -1000, 1000)

scene.add(camera)

// Controls
// const controls = new OrbitControls(camera, canvas)
// controls.target.set(0, 0, 0)
// controls.enableDamping = true
// controls.autoRotateSpeed = 0.5
// controls.autoRotate = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  background: 0xff0000
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))


let gui

const addGUI = () => {
  gui = new dat.GUI()

  gui.add(params, 'distortionLevel', 0, 1000)
  gui.add(params, 'restoreSpeed', 0.8, 0.9999, .00001)
  gui.add(params, 'mousemoveFadeOut', 0.1, 0.9999, .00001)
  gui.add(params, 'maxDist', 1, 200)
  gui.add(params, 'gridDimension', 12, 1024, 1).onChange(addPlane)
}

const textureSize = new THREE.Vector2()

let screenPlane, dataTexture

const addPlane = () => {
  if (screenPlane) {
    scene.remove(screenPlane)
  }
  
  // data texture
  const size = params.gridDimension * params.gridDimension
  const data = new Float32Array(3 * size)

  for (let i = 0; i < size; i++) {
    const color = Math.random() * 255
    const pixel = i * 3
    
    data[pixel] = color
    data[pixel + 1] = color
    data[pixel + 2] = color
  }

  dataTexture = new THREE.DataTexture(data, params.gridDimension, params.gridDimension, THREE.RGBFormat, THREE.FloatType)
  dataTexture.minFilter = dataTexture.magFilter = THREE.NearestFilter

  // plane
  screenPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(innerWidth, innerHeight),
    new THREE.ShaderMaterial({
      fragmentShader: planeFragment,
      vertexShader: planeVertex,
      uniforms: {
        uTexture: { 
          value: new THREE.TextureLoader().load('/billie.jpg', texture => {
            textureSize.x = texture.image.width
            textureSize.y = texture.image.height
            onResize()
          }) 
        },
        uDataTexture: { value: dataTexture },
        uResolution: { value: new THREE.Vector2() },
        uTime: { value: 0 }
      }
    })
  )

  scene.add(screenPlane)
}

function onResize() {
  // Update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  const textureResolution = textureSize.width / textureSize.height
  const screenResolution = sizes.width / sizes.height
  const rX = textureResolution > screenResolution
    ? screenResolution / textureResolution
    : 1
  const rY = textureResolution > screenResolution
    ? 1
    : textureResolution / screenResolution

  const resolution = new THREE.Vector2(rX, rY)

  // uniforms update
  screenPlane.material.uniforms.uResolution.value = resolution

  // Update camera
  // camera.aspect = sizes.width / sizes.height
  // camera.updateProjectionMatrix()
  camera.left = -sizes.width / 2
  camera.right = sizes.width / 2
  camera.top = -sizes.height / 2
  camera.bottom = sizes.height / 2

  // Update renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
}

const addEvents = () => {
  window.addEventListener('mousemove', e => {
    MOUSE.x = e.clientX / sizes.width
    MOUSE.y = e.clientY / sizes.height
    MOUSE.vX = MOUSE.x - MOUSE.prevX
    MOUSE.vY = MOUSE.y - MOUSE.prevY
    MOUSE.prevX = MOUSE.x
    MOUSE.prevY = MOUSE.y
  })

  window.addEventListener('resize', onResize)
}

const updateDataTexture = () => {
  const { data } = dataTexture.image
  const { distortionLevel, restoreSpeed, mousemoveFadeOut, maxDist } = params

  // grid pixels restore their positions
  for (let i = 0; i < data.length; i+=3) {
    data[i] *= restoreSpeed
    data[i + 1] *= restoreSpeed
  }

  // Mouse on grid cell position
  const gridHoverX = Math.round(MOUSE.x * (params.gridDimension - 1))
  const gridHoverY = Math.round((1 - MOUSE.y) * (params.gridDimension - 1))

  // Distortion
  for (let i = 0; i < params.gridDimension; i++) {
    for (let j = 0; j < params.gridDimension; j++) {
      const distance = Math.sqrt((gridHoverX - i)**2 + (gridHoverY - j)**2)
      const index = 3 * (i + params.gridDimension * j)

      if (distance < maxDist) {
        const power = Math.min(4, maxDist / distance)

        data[index] += (MOUSE.vX * distortionLevel) * power
        data[index + 1] -= (MOUSE.vY * distortionLevel) * power
      }
    } 
  }

  // Mouse speed level down after mousemove stops
  MOUSE.vX *= mousemoveFadeOut
  MOUSE.vY *= mousemoveFadeOut

  dataTexture.needsUpdate = true
}

/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0

const tick = () => {
  stats.begin()

  const elapsedTime = clock.getElapsedTime()
  const deltaTime = elapsedTime - previousTime
  previousTime = elapsedTime

  // Update controls
  // controls.update(elapsedTime)

  // data texture update
  updateDataTexture()

  // Uniforms
  screenPlane.material.uniforms.uTime.value = elapsedTime

  renderer.render(scene, camera)

  stats.end()

  // Call tick again on the next frame
  window.requestAnimationFrame(tick)
}

addEvents()
addGUI()
addPlane()
tick()
