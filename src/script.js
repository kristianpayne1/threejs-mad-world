import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as dat from 'lil-gui'
import { noise } from './perlin.js'

/**
 * Base
 */
// Debug
const gui = new dat.GUI()
gui.hide()
let showGUI = false
const parameters = {
    noObjectsZ: 50,
    noObjectsX: 50,
    ambientLightColor: 0xffffff,
    ambientLightIntensity: 2,
    directionalLightColor: 0xffffff,
    directionalLightIntensity: 4,
    directionalLightX: 5,
    directionalLightY: 5,
    directionalLightZ: 5,
    directionalLightRotX: 0,
    directionalLightRotY: 0,
    directionalLightRotZ: 0,
    directionalLightHelper: false,
    elevation: 10,
    waveFrequancy: 3,
    waveSpeed: 0.3,
    perlinNoise: true
}

window.addEventListener('keydown', (e) => {
    if (e.key !== 'c') return;

    showGUI ? gui.hide() : gui.show();
    showGUI = !showGUI;
})
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Models
 */

const gltfLoader = new GLTFLoader()

let mixer = null
let building = null
let objects = []
noise.seed(Math.random())

// Model Methods

const populateScene = (gltf) => {
    if (objects.length !== 0) {
        objects.forEach(object => {
            scene.remove(object)
        });
        objects = []
    }
    for (let i = - ( parameters.noObjectsZ / 2); i < parameters.noObjectsZ / 2; i++) {
        for (let j = - ( parameters.noObjectsX / 2); j < parameters.noObjectsX / 2; j++) {
            const object = gltf.clone()
            const flipZ = Math.random()
            const flipY = Math.round((Math.random() * 2) / 0.5) * 0.5
            object.rotateY(Math.PI * flipY)
            if (flipZ >= 0.5) object.rotateZ(Math.PI) 
            object.position.set(j, 0, i)
            object.castShadow = true;
            object.receiveShadow = true

            objects.push(object)
            scene.add(object)
        }
    }
}


const updateObjectsPosition = (elapsedTime) => {
    if (objects.length === 0) return;
    objects.forEach((object) => {
        let elevation = Math.sin(elapsedTime * parameters.waveSpeed + object.position.x * parameters.waveFrequancy) * Math.cos(elapsedTime * parameters.waveSpeed + object.position.z * parameters.waveFrequancy) * parameters.elevation;
        
        if (parameters.perlinNoise) elevation -= Math.abs(noise.perlin3(object.position.x / 50, object.position.y / 50, elapsedTime * 0.1) * 10);
        
        object.position.y = elevation
    })
}

// Model Debug GUI

gui.add(parameters, "perlinNoise")

const objectsFolder = gui.addFolder('Objects')

objectsFolder.add(parameters, "noObjectsZ", 1, 100, 1).onChange(() => {
    if (!building) return 
    populateScene(building)
})

objectsFolder.add(parameters, "noObjectsX", 1, 100, 1).onChange(() => {
    if (!building) return 
    populateScene(building)
})

objectsFolder.add(parameters, "elevation", 0, 20, 0.1)
objectsFolder.add(parameters, "waveFrequancy", 0, 10, 0.1)
objectsFolder.add(parameters, "waveSpeed", 0, 1, 0.1)

// Model Load

gltfLoader.load(
    './models/building.glb',
    (gltf) =>
    {
        building = gltf.scene
        populateScene(gltf.scene)
    }
)

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(parameters.ambientLightColor, parameters.ambientLightIntensity)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(parameters.directionalLightColor, parameters.directionalLightIntensity)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.camera.left = - 7
directionalLight.shadow.camera.top = 7
directionalLight.shadow.camera.right = 7
directionalLight.shadow.camera.bottom = - 7
directionalLight.position.set(parameters.directionalLightX, parameters.directionalLightY, parameters.directionalLightZ)

// Debug Lights

const directionalLightHelper = new THREE.DirectionalLightHelper( directionalLight )

scene.add(directionalLight)

const lightsFolder = gui.addFolder('Lights')

lightsFolder.addColor(parameters, "ambientLightColor").onChange(() => ambientLight.color.set(parameters.ambientLightColor))
lightsFolder.add(parameters, "ambientLightIntensity", 0, 10, 0.1).onChange(() => ambientLight.intensity = parameters.ambientLightIntensity)
lightsFolder.addColor(parameters, "directionalLightColor").onChange(() => directionalLight.color.set(parameters.directionalLightColor))
lightsFolder.add(parameters, "directionalLightIntensity", 0, 10, 0.1).onChange(() => directionalLight.intensity = parameters.directionalLightIntensity)
lightsFolder.add(parameters, "directionalLightX", -100, 100, 1).onChange(() => directionalLight.position.set(parameters.directionalLightX, parameters.directionalLightY, parameters.directionalLightZ))
lightsFolder.add(parameters, "directionalLightY", -100, 100, 1).onChange(() => directionalLight.position.set(parameters.directionalLightX, parameters.directionalLightY, parameters.directionalLightZ))
lightsFolder.add(parameters, "directionalLightZ", -100, 100, 1).onChange(() => directionalLight.position.set(parameters.directionalLightX, parameters.directionalLightY, parameters.directionalLightZ))
lightsFolder.add(parameters, "directionalLightRotX", - Math.PI, Math.PI, 0.1).onChange(() => directionalLight.rotation.set(parameters.directionalLightRotX, parameters.directionalLightRotY, parameters.directionalLightRotZ))
lightsFolder.add(parameters, "directionalLightRotY", - Math.PI, Math.PI, 0.1).onChange(() => directionalLight.rotation.set(parameters.directionalLightRotX, parameters.directionalLightRotY, parameters.directionalLightRotZ))
lightsFolder.add(parameters, "directionalLightRotZ", - Math.PI, Math.PI, 0.1).onChange(() => directionalLight.rotation.set(parameters.directionalLightRotX, parameters.directionalLightRotY, parameters.directionalLightRotZ))
lightsFolder.add(parameters, "directionalLightHelper").onChange(() => {
    if (parameters.directionalLightHelper) scene.add(directionalLightHelper)
    else scene.remove(directionalLightHelper)
})

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    const aspectRatio = sizes.width / sizes.height
    camera.left = - 1 * aspectRatio
    camera.right = 1 * aspectRatio
    camera.top = 1
    camera.bottom = -1
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const aspectRatio = sizes.width / sizes.height
const camera = new THREE.OrthographicCamera(- 1 * aspectRatio, 1 * aspectRatio, 1, - 1, 0.1, 100)
camera.position.set(40, 40, 40)
camera.zoom = 0.15
camera.updateProjectionMatrix()
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.target.set(1, 0, 1)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.physicallyCorrectLights = true;
renderer.gammaOutput = true;

/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime

    if(mixer)
    {
        mixer.update(deltaTime)
    }

    // Update controls
    controls.update()

    updateObjectsPosition(elapsedTime)

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()