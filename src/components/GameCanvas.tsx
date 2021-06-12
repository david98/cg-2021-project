import React, { useEffect, useRef, useState } from 'react'
import { sampleFragment, sampleVertex, load as loadShaders } from '../shaders'
import { flowerModel, load as loadModels } from '../models'
import { createProgram, createShader } from '../utils'
import { OBJ } from 'webgl-obj-loader'

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
    }, [])

    let i = 0
    let times: number[] = []
    let fps = 0

    const draw = () => {
        if (gl) {
            let vertexShader = createShader(gl, gl.VERTEX_SHADER, sampleVertex)
            let fragmentShader = createShader(
                gl,
                gl.FRAGMENT_SHADER,
                sampleFragment
            )

            OBJ.initMeshBuffers(gl, flowerModel)

            let program = createProgram(gl, vertexShader, fragmentShader)
            if (program) {
                let positionAttributeLocation = gl.getAttribLocation(
                    program,
                    'a_position'
                )
                let positionBuffer = gl.createBuffer()
                gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
                // three 2d points
                let positions = [0, 0, 0, 0.5, 0.7 + i, 0]
                gl.bufferData(
                    gl.ARRAY_BUFFER,
                    new Float32Array(positions),
                    gl.STATIC_DRAW
                )
                let vao = gl.createVertexArray()
                gl.bindVertexArray(vao)
                gl.enableVertexAttribArray(positionAttributeLocation)

                let size = 2 // 2 components per iteration
                let type = gl.FLOAT // the data is 32bit floats
                let normalize = false // don't normalize the data
                let stride = 0 // 0 = move forward size * sizeof(type) each iteration to get the next position
                let offset = 0 // start at the beginning of the buffer
                gl.vertexAttribPointer(
                    positionAttributeLocation,
                    size,
                    type,
                    normalize,
                    stride,
                    offset
                )
                gl.canvas.height = window.innerHeight
                gl.canvas.width = window.innerWidth
                gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

                // Clear the canvas
                gl.clearColor(0, 0, 0, 1)
                gl.clear(gl.COLOR_BUFFER_BIT)

                // Tell it to use our program (pair of shaders)
                gl.useProgram(program)

                // Bind the attribute/buffer set we want.
                gl.bindVertexArray(vao)

                let primitiveType = gl.TRIANGLES
                offset = 0
                let count = 3
                gl.drawArrays(primitiveType, offset, count)

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
                window.requestAnimationFrame(draw)
            }
        }
    }

    if (!loading && !loaded) {
        setLoading(true)
        loadShaders().then(() => {
            loadModels().then(() => {
                setLoading(false)
                setLoaded(true)

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
