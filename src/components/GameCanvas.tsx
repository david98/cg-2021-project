import React, { useEffect, useRef, useState } from 'react'
import {
    load as loadShaders,
    sampleFragment,
    sampleVertex,
    skyboxFragment,
    skyboxVertex,
    terrainVertex,
    terrainFragment,
} from '../shaders'

import {
    flowerModel,
    load as loadModels,
    rock1Model,
    stumpModel,
    tree1Model,
} from '../models'
import { degToRad } from '../utils'
import { OBJ } from 'webgl-obj-loader'
import { Matrix4, Vector3 } from '@math.gl/core'
import { GameObject } from '../utils/GameObject'
import Camera from '../utils/Camera'
import {
    EnvironmentShaderProgram,
    SkyboxShaderProgram,
} from '../utils/ShaderProgram'
import crosshair from '../textures/crosshair.png'
import { Bird } from '../utils/Bird'
import { TerrainShaderProgram } from '../utils/ShaderProgram/TerrainShaderProgram'
import { SphereCollider } from '../utils/Collider'

let camera = new Camera({})
let root = new GameObject({})

let lastRenderTime = performance.now()
const perfectFrameTime = 1000 / 60

let times: number[] = []
let fps = 0
let keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    q: false,
    e: false,
    Shift: false,
}
let turnAmounts = {
    x: 0,
    y: 0,
}
// mouseX and mouseY are in CSS display space relative to canvas
let mouseX = -1
let mouseY = -1

let environmentShaderProgram: EnvironmentShaderProgram | null = null
let skyboxShaderProgram: SkyboxShaderProgram | null = null
let terrainShaderProgram: TerrainShaderProgram | null = null

let initialized = false

export function GameCanvas() {
    const cRef = useRef<HTMLCanvasElement>(null)
    const framerateRef = useRef<HTMLSpanElement>(null)
    const gl = cRef.current?.getContext('webgl2')

    const [loading, setLoading] = useState<boolean>(false)
    const [loaded, setLoaded] = useState<boolean>(false)

    useEffect(() => {
        window.addEventListener('resize', function () {
            if (gl) {
                gl.canvas.height = window.innerHeight
                gl.canvas.width = window.innerWidth
            }
        })

        window.addEventListener('keydown', (e) => {
            if (e.key in keys) {
                keys[e.key as keyof typeof keys] = true
                e.preventDefault()
            }
        })

        window.addEventListener('keyup', (e) => {
            if (e.key in keys) {
                keys[e.key as keyof typeof keys] = false
                e.preventDefault()
            }
        })
    }, [])

    const initMeshBuffers = (
        gl: WebGL2RenderingContext,
        gameObj: GameObject
    ) => {
        if (gameObj.mesh) {
            OBJ.initMeshBuffers(gl, gameObj.mesh)
        }
        for (let child of gameObj.children) {
            initMeshBuffers(gl, child)
        }
    }

    const createGameObjects = (args: {}) => {
        if (!gl || initialized) {
            return
        }
        let flowerObj = new GameObject({ mesh: flowerModel })
        flowerObj.textureSlot = gl.TEXTURE1
        flowerObj.translate({ v: new Vector3([2, 2, -1]) })
        let treeObj = new GameObject({ mesh: tree1Model })
        treeObj.addChild({ child: flowerObj })
        treeObj.textureSlot = gl.TEXTURE1
        treeObj.tick = (args: { deltaTime: number }) => {
            treeObj.rotate({
                angles: new Vector3([0, degToRad(args.deltaTime), 0]),
            })
        }
        treeObj.translate({ v: new Vector3([4, 0, -1]) })
        let rockObj = new GameObject({ mesh: rock1Model })
        rockObj.textureSlot = gl.TEXTURE1
        rockObj.translate({ v: new Vector3([-10, 0, -1]) })
        let stump = new GameObject({ mesh: stumpModel })
        stump.textureSlot = gl.TEXTURE1
        stump.translate({ v: new Vector3([0, 0.2, 4]) })
        let bird = new Bird({ intersectionRadius: 0.5 })
        bird.textureSlot = gl.TEXTURE2
        bird.translate({ v: new Vector3([0, 5, 0]) })
        bird.collider = new SphereCollider({ gameObject: bird })

        root.addChild({ child: treeObj })
        root.addChild({ child: rockObj })
        root.addChild({ child: stump })
        root.addChild({ child: bird })
    }

    const printScene = (gameObj: GameObject) => {
        console.log(gameObj)
        for (let child of gameObj.children) {
            printScene(child)
        }
    }

    const init = () => {
        if (gl) {
            createGameObjects({})
            initMeshBuffers(gl, root)

            if ('requestPointerLock' in gl.canvas) {
                gl.canvas.requestPointerLock()
            }
            const onCanvasClick = () => {
                const checkIntersection = (
                    gameObj: GameObject,
                    rayDir: Vector3
                ) => {
                    if (gameObj.intersectionRadius > 0) {
                        let origin = new Vector3([0, 0, 0])
                        let center = gameObj.position
                            .clone()
                            .transform(camera.getTransform().clone().invert())
                        let radius = gameObj.intersectionRadius

                        let distance = origin.sub(center)

                        let b = rayDir.dot(distance)
                        let c = distance.dot(distance) - radius * radius

                        if (b * b - c >= 0) {
                            console.log('collision')
                            gameObj.onClick()
                        } else {
                            console.log('no collision')
                        }
                    }

                    for (let child of gameObj.children) {
                        checkIntersection(child, rayDir)
                    }
                }
                if (
                    'requestPointerLock' in gl.canvas &&
                    document.pointerLockElement !== gl.canvas
                ) {
                    gl.canvas.requestPointerLock()
                } else if (document.pointerLockElement === gl.canvas) {
                    const rayDir = new Vector3([0, 0, -1])
                    console.log('raycast')
                    checkIntersection(root, rayDir)
                }
            }
            if (!initialized) gl.canvas.addEventListener('click', onCanvasClick)

            const onMouseMove = (e: any) => {
                if (document.pointerLockElement === gl.canvas) {
                    turnAmounts.x = -e.movementY
                    turnAmounts.y = -e.movementX

                    if ('getBoundingClientRect' in gl.canvas) {
                        const rect = gl.canvas.getBoundingClientRect()
                        mouseX = e.clientX - rect.left
                        mouseY = e.clientY - rect.top
                    }
                }
            }

            if (!initialized)
                gl.canvas.addEventListener('mousemove', onMouseMove)

            skyboxShaderProgram = new SkyboxShaderProgram({
                gl,
                vertexShaderSource: skyboxVertex,
                fragmentShaderSource: skyboxFragment,
            })

            environmentShaderProgram = new EnvironmentShaderProgram({
                gl,
                vertexShaderSource: sampleVertex,
                fragmentShaderSource: sampleFragment,
            })

            terrainShaderProgram = new TerrainShaderProgram({
                gl,
                vertexShaderSource: terrainVertex,
                fragmentShaderSource: terrainFragment,
            })

            initialized = true
        }
    }

    const updateFPS = () => {
        const now = performance.now()
        while (times.length > 0 && times[0] <= now - 1000) {
            times.shift()
        }
        times.push(now)
        let smoothing = 0.9 // larger=more smoothing
        fps = fps * smoothing + times.length * (1.0 - smoothing)

        if (framerateRef && framerateRef.current) {
            framerateRef.current.innerText = `FPS: ${Math.round(fps)}`
        }
    }

    const handleInput = (deltaTime: number) => {
        let speed = 0.1
        if (keys.Shift) {
            speed = 0.5
        }
        const turnSpeed = 1

        if (keys.w || keys.s) {
            const direction = keys.w ? 1 : -1
            camera.translateLocal({
                v: new Vector3([0, 0, -1]).multiplyScalar(
                    deltaTime * speed * direction
                ),
            })
        }

        if (keys.a || keys.d) {
            const direction = keys.d ? 1 : -1
            camera.translateLocal({
                v: new Vector3([1, 0, 0]).multiplyScalar(
                    deltaTime * speed * direction
                ),
            })
        }

        let amtX = turnAmounts.x * deltaTime * turnSpeed
        turnAmounts.x -= amtX

        let amtY = turnAmounts.y * deltaTime * turnSpeed
        turnAmounts.y -= amtY

        camera.rotate({
            angles: new Vector3([degToRad(amtY), degToRad(amtX), 0]),
            bounds: new Vector3([degToRad(80), degToRad(360), degToRad(0)]),
        })
    }

    const tick = (deltaTime: number, gameObj: GameObject) => {
        // execute logic
        gameObj.tick({ deltaTime })
        for (let child of gameObj.children) {
            tick(deltaTime, child)
        }
    }

    const draw = () => {
        const now = performance.now()
        const deltaTime = (now - lastRenderTime) / perfectFrameTime
        tick(deltaTime, root)

        const zNear = 0.1
        const zFar = 500
        const fovRadians = degToRad(60)

        if (gl) {
            gl.enable(gl.DEPTH_TEST)
            gl.enable(gl.CULL_FACE)

            gl.depthFunc(gl.LEQUAL)

            // Clear the canvas
            gl.clearColor(0, 0, 0, 1)
            gl.clear(gl.DEPTH_BUFFER_BIT)
            gl.clear(gl.COLOR_BUFFER_BIT)

            handleInput(deltaTime)
            let aspect = gl.canvas.width / gl.canvas.height
            if ('clientWidth' in gl.canvas) {
                aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
            }

            gl.canvas.height = window.innerHeight
            gl.canvas.width = window.innerWidth
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

            const projMat = new Matrix4().perspective({
                fov: fovRadians,
                aspect,
                near: zNear,
                far: zFar,
            })

            // Make a view matrix from the camera matrix.
            const view = camera.getTransform().clone().invert()

            // Draw environment
            if (environmentShaderProgram) {
                environmentShaderProgram.render({
                    gameObj: root,
                    viewMatrix: view,
                    projMatrix: projMat,
                })
            }

            // Draw terrain
            if (terrainShaderProgram) {
                terrainShaderProgram.render({
                    viewMatrix: view,
                    projMatrix: projMat,
                })
            }

            // Draw skybox
            if (skyboxShaderProgram) {
                skyboxShaderProgram.render({
                    viewMatrix: new Matrix4().fromQuaternion(
                        camera.orientation.clone().invert()
                    ),
                    projMatrix: projMat,
                })
            }

            updateFPS()
            lastRenderTime = now
            window.requestAnimationFrame(draw)
        }
    }

    if (!loading && !loaded) {
        setLoading(true)
        loadShaders().then(() => {
            loadModels().then(() => {
                setLoading(false)
                setLoaded(true)

                init()
                window.requestAnimationFrame(draw)
            })
        })
    }

    return (
        <React.Fragment>
            <canvas id="c" ref={cRef}></canvas>
            <span id="framerate" ref={framerateRef}></span>
            <img id="crosshair" src={crosshair} />
        </React.Fragment>
    )
}

export default GameCanvas
