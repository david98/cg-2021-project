import React, { useEffect, useRef, useState } from 'react'
import {
    sampleFragment,
    sampleVertex,
    skyboxVertex,
    skyboxFragment,
    load as loadShaders,
} from '../shaders'
import negx from '../textures/skybox/negx.jpg'
import negy from '../textures/skybox/negy.jpg'
import negz from '../textures/skybox/negz.jpg'
import posx from '../textures/skybox/posx.jpg'
import posy from '../textures/skybox/posy.jpg'
import posz from '../textures/skybox/posz.jpg'
import textureImg from '../textures/texture.jpg'

import {
    flowerModel,
    tree1Model,
    rock1Model,
    stumpModel,
    load as loadModels,
    rock2Model,
} from '../models'
import { createProgram, createShader, degToRad } from '../utils'
import { OBJ } from 'webgl-obj-loader'
import { Euler, Matrix4, Vector3, Vector4 } from '@math.gl/core'
import { GameObject } from '../utils/GameObject'
import Camera from '../utils/Camera'
import { ShaderProgram } from '../utils/ShaderProgram'
import { EnvironmentShaderProgram } from '../utils/EnvironmentShaderProgram'

let camera = new Camera({})
let root = new GameObject({})

const lightColor = new Vector4([1, 0.6, 0.2, 1])

let lastRenderTime = performance.now()
const perfectFrameTime = 1000 / 60

let times: number[] = []
let fps = 0
const directionalLightDir = new Vector3([1, -1, -1])
const pointLightPosition = new Vector3([10, 10, 0])
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

let pointLightWorldPositionLocation: WebGLUniformLocation | null = null
let vegetationTexcoordAttributeLocation: number | null = null
let vegetationTextureLocation: WebGLUniformLocation | null = null

// Create a texture.
let texture: WebGLTexture | null = null

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

    const loadSkybox = (gl: WebGL2RenderingContext) => {
        // Create a texture.
        let texture = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture)

        const faceInfos = [
            {
                target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
                url: posx,
            },
            {
                target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
                url: negx,
            },
            {
                target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
                url: posy,
            },
            {
                target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
                url: negy,
            },
            {
                target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
                url: posz,
            },
            {
                target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
                url: negz,
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
            gl.activeTexture(gl.TEXTURE0)
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
            image.addEventListener('load', function () {
                // Now that the image has loaded make copy it to the texture.
                gl.activeTexture(gl.TEXTURE0)
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture)
                gl.texImage2D(
                    target,
                    level,
                    internalFormat,
                    format,
                    type,
                    image
                )
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
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

    const createGameObjects = () => {
        let flowerObj = new GameObject({ mesh: flowerModel })
        flowerObj.translate({ v: new Vector3([2, 2, -1]) })
        let treeObj = new GameObject({ mesh: tree1Model })
        treeObj.addChild({ child: flowerObj })
        treeObj.tick = (args: { deltaTime: number }) => {
            treeObj.rotate({
                angles: new Vector3([0, degToRad(args.deltaTime), 0]),
            })
        }
        let rockObj = new GameObject({ mesh: rock1Model })
        rockObj.translate({ v: new Vector3([-10, 0, -1]) })
        let stump = new GameObject({ mesh: stumpModel })
        stump.translate({ v: new Vector3([0, 0, 4]) })

        root.addChild({ child: treeObj })
        root.addChild({ child: rockObj })
        root.addChild({ child: stump })
    }

    const init = () => {
        if (gl) {
            createGameObjects()
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

            const environmentShaderProgram = new EnvironmentShaderProgram({
                gl,
                vertexShaderSource: sampleVertex,
                fragmentShaderSource: sampleFragment,
            })

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

            pointLightWorldPositionLocation = gl.getUniformLocation(
                vegetationProgram,
                'u_lightWorldPosition'
            )
            vegetationTexcoordAttributeLocation = gl.getAttribLocation(
                vegetationProgram,
                'a_texcoord'
            )
            vegetationTextureLocation = gl.getUniformLocation(
                vegetationProgram,
                'u_texture'
            )

            texture = gl.createTexture()
            gl.activeTexture(gl.TEXTURE1)
            gl.bindTexture(gl.TEXTURE_2D, texture)

            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                1,
                1,
                0,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                new Uint8Array([0, 0, 255, 255])
            )

            let image = new Image()
            image.src = textureImg
            image.addEventListener('load', function () {
                // Now that the image has loaded make copy it to the texture.
                gl.activeTexture(gl.TEXTURE1)
                gl.bindTexture(gl.TEXTURE_2D, texture)
                gl.texImage2D(
                    gl.TEXTURE_2D,
                    0,
                    gl.RGBA,
                    gl.RGBA,
                    gl.UNSIGNED_BYTE,
                    image
                )
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
                gl.texParameteri(
                    gl.TEXTURE_2D,
                    gl.TEXTURE_MAG_FILTER,
                    gl.LINEAR
                )
                gl.texParameteri(
                    gl.TEXTURE_2D,
                    gl.TEXTURE_MIN_FILTER,
                    gl.LINEAR
                )
                gl.generateMipmap(gl.TEXTURE_2D)
                gl.texParameteri(
                    gl.TEXTURE_2D,
                    gl.TEXTURE_WRAP_S,
                    gl.CLAMP_TO_EDGE
                )
                gl.texParameteri(
                    gl.TEXTURE_2D,
                    gl.TEXTURE_WRAP_T,
                    gl.CLAMP_TO_EDGE
                )
            })
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

            const colorLocation = gl.getUniformLocation(program, 'u_lightColor')
            gl.uniform4fv(colorLocation, lightColor)
            gl.uniform1i(vegetationTextureLocation, 1)

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

            if (!vegetationTexcoordAttributeLocation) {
                console.error('')
                return
            }

            gl.bindBuffer(gl.ARRAY_BUFFER, gameObj.mesh.textureBuffer)
            gl.enableVertexAttribArray(vegetationTexcoordAttributeLocation)
            gl.vertexAttribPointer(
                vegetationTexcoordAttributeLocation,
                2,
                gl.FLOAT,
                true,
                0,
                0
            )

            let primitiveType = gl.TRIANGLES
            let offset = 0

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gameObj.mesh.indexBuffer)
            gl.activeTexture(gl.TEXTURE1)
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

            // Make a view matrix from the camera matrix.
            const view = camera.getTransform().clone().invert()

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
                        camera.orientation.clone().invert()
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
            gl.uniform3fv(pointLightWorldPositionLocation, pointLightPosition)

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
