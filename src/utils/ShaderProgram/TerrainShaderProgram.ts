import { ShaderProgram } from './ShaderProgram'
import { Matrix4 } from '@math.gl/core'

export class TerrainShaderProgram extends ShaderProgram {
    private vertices: number[]
    private indices: number[]

    private vertexBuffer: WebGLBuffer | null
    private indexBuffer: WebGLBuffer | null

    private positionAttributeLocation: number

    private viewMatrixLocation: WebGLUniformLocation | null
    private projMatrixLocation: WebGLUniformLocation | null

    constructor(args: {
        gl: WebGL2RenderingContext
        vertexShaderSource: string
        fragmentShaderSource: string
    }) {
        super(args)
        let gl = this.gl

        const size = 100

        this.vertices = [
            -size,
            0,
            0.0,
            1.0,
            -size,
            0,
            -size,
            1.0,
            size,
            0,
            0.0,
            1.0,
            size,
            0,
            size,
            1.0,
        ]
        this.indices = [3, 2, 1, 3, 1, 0]

        this.vertexBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer)
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(this.vertices),
            gl.STATIC_DRAW
        )
        this.indexBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer)
        gl.bufferData(
            gl.ELEMENT_ARRAY_BUFFER,
            new Uint16Array(this.indices),
            gl.STATIC_DRAW
        )
        if (!this.glProgram) {
            throw new Error('GL Program error')
        }

        this.positionAttributeLocation = gl.getAttribLocation(
            this.glProgram,
            'a_position'
        )
        gl.enableVertexAttribArray(this.positionAttributeLocation)

        this.viewMatrixLocation = gl.getUniformLocation(
            this.glProgram,
            'u_view'
        )
        this.projMatrixLocation = gl.getUniformLocation(
            this.glProgram,
            'u_proj'
        )
    }

    render(args: { viewMatrix: Matrix4; projMatrix: Matrix4 }) {
        super.render(args)

        let gl = this.gl

        gl.uniformMatrix4fv(this.viewMatrixLocation, false, args.viewMatrix)
        gl.uniformMatrix4fv(this.projMatrixLocation, false, args.projMatrix)

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer)
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer)

        // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        let size = 4 // 2 components per iteration
        let type = gl.FLOAT // the data is 32bit floats
        let normalize = false // don't normalize the data
        let stride = 0 // 0 = move forward size * sizeof(type) each iteration to get the next position
        let offset = 0 // start at the beginning of the buffer
        gl.vertexAttribPointer(
            this.positionAttributeLocation,
            size,
            type,
            normalize,
            stride,
            offset
        )

        // Draw the geometry.
        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0)
    }
}
