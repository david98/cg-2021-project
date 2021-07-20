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
    rock2Model,
    rock3Model,
    rock4Model,
    stumpModel,
    tree1Model,
    tree2Model,
    tree3Model,
    tree4Model,
} from '../models'
import { degToRad, getRandomArbitrary } from '../utils'
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

    const resizeCanvasToDisplaySize = (canvas: HTMLCanvasElement) => {
        // Lookup the size the browser is displaying the canvas in CSS pixels.
        const displayWidth = canvas.clientWidth
        const displayHeight = canvas.clientHeight

        // Check if the canvas is not the same size.
        const needResize =
            canvas.width !== displayWidth || canvas.height !== displayHeight

        if (needResize) {
            // Make the canvas the same size
            canvas.width = displayWidth
            canvas.height = displayHeight
        }

        return needResize
    }

    const createGameObjects = (args: {
        treesCount: number
        rocksCount: number
        flowersCount: number
        stumpsCount: number
    }) => {
        if (!gl || initialized) {
            return
        }

        let positions: Vector3[] = []
        // this is terribly inefficient
        const getFreePosition = (): Vector3 => {
            let position: Vector3

            position = new Vector3([
                getRandomArbitrary(-100, 100),
                0,
                getRandomArbitrary(-100, 100),
            ])

            positions.push(position)
            return position
        }

        let treeModels = [tree1Model, tree2Model, tree3Model, tree4Model]

        for (let i = 0; i < args.treesCount; i++) {
            let treeObj = new GameObject({
                mesh: treeModels[Math.floor(Math.random() * treeModels.length)],
            })
            treeObj.textureSlot = gl.TEXTURE1
            treeObj.translate({ v: getFreePosition() })
            root.addChild({ child: treeObj })
        }

        for (let i = 0; i < args.flowersCount; i++) {
            let flowerObj = new GameObject({ mesh: flowerModel })
            flowerObj.textureSlot = gl.TEXTURE1
            flowerObj.translate({
                v: getFreePosition().add(new Vector3([0, 0.2, 0])),
            })
            root.addChild({ child: flowerObj })
        }

        let rockModels = [rock1Model, rock2Model, rock3Model, rock4Model]

        for (let i = 0; i < args.rocksCount; i++) {
            let rockObj = new GameObject({
                mesh: rockModels[Math.floor(Math.random() * rockModels.length)],
            })
            rockObj.textureSlot = gl.TEXTURE1
            rockObj.translate({ v: getFreePosition() })
            root.addChild({ child: rockObj })
        }

        for (let i = 0; i < args.stumpsCount; i++) {
            let stump = new GameObject({ mesh: stumpModel })
            stump.textureSlot = gl.TEXTURE1
            stump.translate({
                v: getFreePosition().add(new Vector3([0, 0.2, 0])),
            })
            root.addChild({ child: stump })
        }

        let bird = new Bird({ intersectionRadius: 0.5 })
        bird.textureSlot = gl.TEXTURE2
        bird.translate({ v: new Vector3([0, 5, 0]) })
        bird.collider = new SphereCollider({ gameObject: bird })

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
            createGameObjects({
                treesCount: 75,
                flowersCount: 250,
                rocksCount: 10,
                stumpsCount: 50,
            })
            initMeshBuffers(gl, root)

            if ('requestPointerLock' in gl.canvas) {
                gl.canvas.requestPointerLock()
            }
            const onCanvasClick = () => {
                const checkIntersection = (
                    gameObj: GameObject,
                    rayDir: Vector3
                ) => {
                    if (gameObj.collider) {
                        let origin = new Vector3([0, 0, 0]).transformAsPoint(
                            camera.getTransform()
                        )
                        console.log(rayDir)
                        console.log(origin)
                        if (
                            gameObj.collider.raycast({
                                rayOrigin: origin,
                                rayDirection: rayDir,
                            })
                        ) {
                            console.log('collision')
                            gameObj.onClick()
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
                        .transformAsVector(camera.getTransform())
                        .normalize()
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
            window.addEventListener('resize', () => {
                resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement)
            })
            resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement)

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
            framerateRef.current.innerText = `FPS: ${Math.round(fps / 2)}`
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
