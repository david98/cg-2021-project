import React, { useEffect, useRef, useState } from 'react'
import {
    sampleFragment,
    sampleVertex,
    skyboxVertex,
    skyboxFragment,
    load as loadShaders,
} from '../shaders'
import { flowerModel, tree1Model, load as loadModels } from '../models'
import { createProgram, createShader, degToRad } from '../utils'
import { OBJ } from 'webgl-obj-loader'
import { Euler, Matrix4, Vector3, Vector4 } from '@math.gl/core'
import { GameObject } from '../utils/GameObject'

let cameraObj = new GameObject({})
let root = new GameObject({})
let flowerObj = new GameObject({})
flowerObj.translate({ v: new Vector3([2, 2, -1]) })
flowerObj.color = new Vector4([1.0, 0, 0, 1])
let treeObj = new GameObject({})
treeObj.addChild({ child: flowerObj })
treeObj.color = new Vector4([0.2, 1, 0, 1])
root.addChild({ child: treeObj })

let camera = new Matrix4()

let lastRenderTime = performance.now()
const perfectFrameTime = 1000 / 60

let times: number[] = []
let fps = 0
const directionalLightDir = new Vector3([-1, 1, 0])
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

// Shaders
let vegetationVertexShader: WebGLShader | null | undefined = null
let vegetationFragmentShader: WebGLShader | null | undefined = null
let skyboxVertexShader: WebGLShader | null | undefined = null
let skyboxFragmentShader: WebGLShader | null | undefined = null

let vegetationProgram: WebGLProgram | null | undefined = null
let skyboxProgram: WebGLProgram | null | undefined = null

// Shaders Locations
let skyboxVAO: WebGLVertexArrayObject | null = null
let skyboxPositionLocation: number | null = null
let skyboxLocation: WebGLUniformLocation | null = null
let skyboxViewDirectionProjectionInverseLocation: WebGLUniformLocation | null =
    null

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

    const loadSkybox = (gl: WebGL2RenderingContext) => {
        // Create a texture.
        var texture = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture)

        const faceInfos = [
            {
                target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
                url: 'https://webgl2fundamentals.org/webgl/resources/images/computer-history-museum/pos-x.jpg',
            },
            {
                target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
                url: 'https://webgl2fundamentals.org/webgl/resources/images/computer-history-museum/neg-x.jpg',
            },
            {
                target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
                url: 'https://webgl2fundamentals.org/webgl/resources/images/computer-history-museum/pos-y.jpg',
            },
            {
                target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
                url: 'https://webgl2fundamentals.org/webgl/resources/images/computer-history-museum/neg-y.jpg',
            },
            {
                target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
                url: 'https://webgl2fundamentals.org/webgl/resources/images/computer-history-museum/pos-z.jpg',
            },
            {
                target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
                url: 'https://webgl2fundamentals.org/webgl/resources/images/computer-history-museum/neg-z.jpg',
            },
        ]
        faceInfos.forEach((faceInfo) => {
            const { target, url } = faceInfo

            // Upload the canvas to the cubemap face.
            const level = 0
            const internalFormat = gl.RGBA
            const width = 512
            const height = 512
            const format = gl.RGBA
            const type = gl.UNSIGNED_BYTE

            // setup each face so it's immediately renderable
            gl.texImage2D(
                target,
                level,
                internalFormat,
                width,
                height,
                0,
                format,
                type,
                null
            )

            // Asynchronously load an image
            const image = new Image()
            image.src = url
            image.crossOrigin = ''
            image.addEventListener('load', function () {
                // Now that the image has loaded make copy it to the texture.
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture)
                gl.texImage2D(
                    target,
                    level,
                    internalFormat,
                    format,
                    type,
                    image
                )
                gl.generateMipmap(gl.TEXTURE_CUBE_MAP)
            })
        })
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP)
        gl.texParameteri(
            gl.TEXTURE_CUBE_MAP,
            gl.TEXTURE_MIN_FILTER,
            gl.LINEAR_MIPMAP_LINEAR
        )
    }

    const init = () => {
        if (gl) {
            flowerObj.mesh = flowerModel
            treeObj.mesh = tree1Model
            initMeshBuffers(gl, root)

            if ('requestPointerLock' in gl.canvas) {
                gl.canvas.requestPointerLock()
            }
            gl.canvas.addEventListener('click', () => {
                if ('requestPointerLock' in gl.canvas) {
                    gl.canvas.requestPointerLock()
                }
            })
            gl.canvas.addEventListener('mousemove', (e: any) => {
                turnAmounts.x = -e.movementY
                turnAmounts.y = -e.movementX
            })

            skyboxVertexShader = createShader(
                gl,
                gl.VERTEX_SHADER,
                skyboxVertex
            )
            skyboxFragmentShader = createShader(
                gl,
                gl.FRAGMENT_SHADER,
                skyboxFragment
            )

            if (!skyboxVertexShader || !skyboxFragmentShader) {
                console.error('Missing skybox shaders')
                return
            }

            skyboxProgram = createProgram(
                gl,
                skyboxVertexShader,
                skyboxFragmentShader
            )

            if (!skyboxProgram) {
                console.error('Error while creating skybox program')
                return
            }

            vegetationVertexShader = createShader(
                gl,
                gl.VERTEX_SHADER,
                sampleVertex
            )
            vegetationFragmentShader = createShader(
                gl,
                gl.FRAGMENT_SHADER,
                sampleFragment
            )

            if (!vegetationVertexShader || !vegetationFragmentShader) {
                console.error('Missing vegetation shaders')
                return
            }

            vegetationProgram = createProgram(
                gl,
                vegetationVertexShader,
                vegetationFragmentShader
            )

            if (!vegetationProgram) {
                console.error('Error while creating vegetation program')
                return
            }

            skyboxVAO = gl.createVertexArray()
            skyboxPositionLocation = gl.getAttribLocation(
                skyboxProgram,
                'a_position'
            )
            skyboxLocation = gl.getUniformLocation(skyboxProgram, 'u_skybox')
            skyboxViewDirectionProjectionInverseLocation =
                gl.getUniformLocation(
                    skyboxProgram,
                    'u_viewDirectionProjectionInverse'
                )

            loadSkybox(gl)
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

        let amtX = turnAmounts.x * deltaTime * turnSpeed
        turnAmounts.x -= amtX

        let amtY = turnAmounts.y * deltaTime * turnSpeed
        turnAmounts.y -= amtY

        cameraObj.rotate({
            angles: new Vector3([degToRad(amtX), degToRad(amtY), 0]),
        })
    }

    const renderRecursive = (
        gl: WebGL2RenderingContext,
        program: WebGLProgram,
        gameObj: GameObject,
        positionAttributeLocation: number,
        normalAttributeLocation: number,
        worldMatLocation: WebGLUniformLocation | null,
        parentTransform: Matrix4
    ) => {
        if (gameObj.mesh) {
            if (worldMatLocation) {
                const worldMat = gameObj.getTransform()
                gl.uniformMatrix4fv(
                    worldMatLocation,
                    false,
                    worldMat.multiplyRight(parentTransform)
                )
            }

            const colorLocation = gl.getUniformLocation(program, 'u_color')
            gl.uniform4fv(colorLocation, gameObj.color)

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
                program,
                child,
                positionAttributeLocation,
                normalAttributeLocation,
                worldMatLocation,
                new Matrix4()
                    .fromQuaternion(gameObj.orientation)
                    .translate(gameObj.position)
            )
        }
    }

    const draw = () => {
        const now = performance.now()
        const deltaTime = (now - lastRenderTime) / perfectFrameTime

        const zNear = 0.1
        const zFar = 100
        const fovRadians = degToRad(60)

        if (gl) {
            gl.enable(gl.DEPTH_TEST)
            gl.enable(gl.CULL_FACE)

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

            camera = cameraObj.getTransform()

            // Make a view matrix from the camera matrix.
            const view = camera.invert()

            // Draw skybox
            if (!skyboxProgram) {
                console.error('Skybox program error')
                return
            }

            gl.useProgram(skyboxProgram)

            // and make it the one we're currently working with
            gl.bindVertexArray(skyboxVAO)

            // Create a buffer for positions
            let positionBuffer = gl.createBuffer()
            // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
            // Put the positions in the buffer
            let positions = new Float32Array([
                -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
            ])
            gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

            if (skyboxPositionLocation === null) {
                console.error('Skybox position location is null')
                return
            }

            // Turn on the position attribute
            gl.enableVertexAttribArray(skyboxPositionLocation)

            // Bind the position buffer.
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

            // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
            let size = 2 // 2 components per iteration
            let type = gl.FLOAT // the data is 32bit floats
            let normalize = false // don't normalize the data
            let stride = 0 // 0 = move forward size * sizeof(type) each iteration to get the next position
            let offset = 0 // start at the beginning of the buffer
            gl.vertexAttribPointer(
                skyboxPositionLocation,
                size,
                type,
                normalize,
                stride,
                offset
            )

            let viewDirectionProjectionMatrix = projMat
                .clone()
                .multiplyRight(
                    new Matrix4().fromQuaternion(
                        cameraObj.orientation.clone().invert()
                    )
                )
            let viewDirectionProjectionInverseMatrix =
                viewDirectionProjectionMatrix.invert()

            // Set the uniforms
            gl.uniformMatrix4fv(
                skyboxViewDirectionProjectionInverseLocation,
                false,
                viewDirectionProjectionInverseMatrix
            )

            // Tell the shader to use texture unit 0 for u_skybox
            gl.uniform1i(skyboxLocation, 0)

            // let our quad pass the depth test at 1.0
            gl.depthFunc(gl.LEQUAL)

            // Draw the geometry.
            gl.drawArrays(gl.TRIANGLES, 0, 6)

            // Draw vegetation
            if (!vegetationProgram) {
                console.error('Vegetation program error')
                return
            }
            gl.useProgram(vegetationProgram)

            let worldMatLoc = gl.getUniformLocation(
                vegetationProgram,
                'u_world'
            )
            let viewMatLoc = gl.getUniformLocation(vegetationProgram, 'u_view')
            let projMatLoc = gl.getUniformLocation(vegetationProgram, 'u_proj')
            let dirLightDirLoc = gl.getUniformLocation(
                vegetationProgram,
                'u_directionalLightDir'
            )

            gl.uniformMatrix4fv(viewMatLoc, false, view)
            gl.uniformMatrix4fv(projMatLoc, false, projMat)
            gl.uniform3fv(dirLightDirLoc, directionalLightDir)

            let positionAttributeLocation = gl.getAttribLocation(
                vegetationProgram,
                'a_position'
            )
            let normalAttributeLocation = gl.getAttribLocation(
                vegetationProgram,
                'a_normal'
            )

            gl.enableVertexAttribArray(positionAttributeLocation)
            gl.enableVertexAttribArray(normalAttributeLocation)

            treeObj.orientation.rotateY(degToRad(2) * deltaTime)
            flowerObj.orientation.rotateY(degToRad(10) * deltaTime)

            renderRecursive(
                gl,
                vegetationProgram,
                root,
                positionAttributeLocation,
                normalAttributeLocation,
                worldMatLoc,
                new Matrix4().identity()
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
