import React, { useEffect, useRef, useState } from 'react'
import { sampleFragment, sampleVertex, load as loadShaders } from '../shaders'
import { flowerModel, tree1Model, load as loadModels } from '../models'
import { createProgram, createShader, degToRad } from '../utils'
import { OBJ } from 'webgl-obj-loader'
import { Matrix4, Vector3 } from 'math.gl'
import { GameObject } from '../utils/GameObject'

let cameraObj = new GameObject({})
let root = new GameObject({})
let flowerObj = new GameObject({})
let treeObj = new GameObject({})
treeObj.addChild({ child: flowerObj })
root.addChild({ child: treeObj })

let camera = new Matrix4()

let lastRenderTime = performance.now()
const perfectFrameTime = 1000 / 60

let times: number[] = []
let fps = 0
const directionalLightDir = new Vector3([-1, -1, 0]).normalize()
let lastMouseCoords = { x: 0, y: 0 }
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
}

export function GameCanvas() {
    const cRef = useRef<HTMLCanvasElement>(null)
    const framerateRef = useRef<HTMLSpanElement>(null)
    const gl = cRef.current?.getContext('webgl2')
    let program: WebGLProgram | null | undefined = undefined

    const [loading, setLoading] = useState<boolean>(false)
    const [loaded, setLoaded] = useState<boolean>(false)

    useEffect(() => {
        window.addEventListener('resize', function () {
            if (gl) {
                gl.canvas.height = window.innerHeight
                gl.canvas.width = window.innerWidth
            }
        })

        window.addEventListener('mousemove', (e) => {
            const deltaX = e.clientX - lastMouseCoords.x
            const deltaY = e.clientY - lastMouseCoords.y

            lastMouseCoords = { x: e.clientX, y: e.clientY }
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

    const init = () => {
        if (gl) {
            let vertexShader = createShader(gl, gl.VERTEX_SHADER, sampleVertex)
            let fragmentShader = createShader(
                gl,
                gl.FRAGMENT_SHADER,
                sampleFragment
            )
            flowerObj.mesh = flowerModel
            treeObj.mesh = tree1Model
            initMeshBuffers(gl, root)

            program = createProgram(gl, vertexShader, fragmentShader)
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
        const speed = 0.1
        const turnSpeed = 1.0

        if (keys.w || keys.s) {
            const direction = keys.w ? 1 : -1
            cameraObj.translateLocal({
                v: new Vector3([0, 0, -1]).multiplyScalar(
                    deltaTime * speed * direction
                ),
            })
        }

        if (keys.a || keys.d) {
            const direction = keys.d ? 1 : -1
            cameraObj.translateLocal({
                v: new Vector3([1, 0, 0]).multiplyScalar(
                    deltaTime * speed * direction
                ),
            })
        }

        if (keys.q || keys.e) {
            const direction = keys.q ? 1 : -1
            cameraObj.rotateLocal({
                angles: new Vector3([
                    0,
                    0,
                    degToRad(deltaTime * turnSpeed * direction),
                ]),
            })
        }

        if (keys.ArrowLeft || keys.ArrowRight) {
            const direction = keys.ArrowLeft ? 1 : -1
            cameraObj.rotateLocal({
                angles: new Vector3([
                    0,
                    degToRad(deltaTime * turnSpeed * direction),
                    0,
                ]),
            })
        }

        if (keys.ArrowUp || keys.ArrowDown) {
            const direction = keys.ArrowUp ? 1 : -1
            cameraObj.rotateLocal({
                angles: new Vector3([
                    degToRad(deltaTime * turnSpeed * direction),
                    0,
                    0,
                ]),
            })
        }
    }

    const renderRecursive = (
        gl: WebGL2RenderingContext,
        gameObj: GameObject,
        positionAttributeLocation: number,
        normalAttributeLocation: number
    ) => {
        if (gameObj.mesh) {
            gl.bindBuffer(gl.ARRAY_BUFFER, gameObj.mesh.vertexBuffer)
            gl.vertexAttribPointer(
                positionAttributeLocation,
                flowerModel.vertexBuffer.itemSize,
                gl.FLOAT,
                false,
                0,
                0
            )

            gl.bindBuffer(gl.ARRAY_BUFFER, gameObj.mesh.normalBuffer)
            gl.vertexAttribPointer(
                normalAttributeLocation,
                flowerModel.normalBuffer.itemSize,
                gl.FLOAT,
                false,
                0,
                0
            )

            let primitiveType = gl.TRIANGLES
            let offset = 0

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gameObj.mesh.indexBuffer)
            gl.drawElements(
                primitiveType,
                gameObj.mesh.indexBuffer.numItems,
                gl.UNSIGNED_SHORT,
                offset
            )
        }

        for (let child of gameObj.children) {
            renderRecursive(
                gl,
                child,
                positionAttributeLocation,
                normalAttributeLocation
            )
        }
    }

    const draw = () => {
        const now = performance.now()
        const deltaTime = (now - lastRenderTime) / perfectFrameTime

        const zNear = 0.1
        const zFar = 50
        const fovRadians = degToRad(60)

        if (gl && program) {
            // Tell it to use our program (pair of shaders)
            gl.useProgram(program)

            // gl.enable(gl.DEPTH_TEST)
            // gl.enable(gl.CULL_FACE)

            handleInput(deltaTime)

            const aspect = gl.canvas.width / gl.canvas.height
            const projMat = new Matrix4().perspective({
                fov: fovRadians,
                aspect,
                near: zNear,
                far: zFar,
            })

            camera = new Matrix4()
                .fromQuaternion(cameraObj.orientation)
                .translate(cameraObj.position)
                .multiplyRight(
                    new Matrix4().fromQuaternion(cameraObj.orientation)
                )

            // Make a view matrix from the camera matrix.
            const view = camera.invert()

            const worldMat = new Matrix4().scale(1)

            let worldMatLoc = gl.getUniformLocation(program, 'u_world')
            let viewMatLoc = gl.getUniformLocation(program, 'u_view')
            let projMatLoc = gl.getUniformLocation(program, 'u_proj')
            let dirLightDirLoc = gl.getUniformLocation(
                program,
                'u_directionalLightDir'
            )

            gl.uniformMatrix4fv(worldMatLoc, false, worldMat)
            gl.uniformMatrix4fv(viewMatLoc, false, view)
            gl.uniformMatrix4fv(projMatLoc, false, projMat)
            gl.uniform3fv(dirLightDirLoc, directionalLightDir)

            let positionAttributeLocation = gl.getAttribLocation(
                program,
                'a_position'
            )
            let normalAttributeLocation = gl.getAttribLocation(
                program,
                'a_normal'
            )

            gl.enableVertexAttribArray(positionAttributeLocation)
            gl.enableVertexAttribArray(normalAttributeLocation)

            gl.canvas.height = window.innerHeight
            gl.canvas.width = window.innerWidth
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

            // Clear the canvas
            gl.clearColor(0, 0, 0, 1)
            gl.clear(gl.COLOR_BUFFER_BIT)

            renderRecursive(
                gl,
                root,
                positionAttributeLocation,
                normalAttributeLocation
            )
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
        </React.Fragment>
    )
}

export default GameCanvas
