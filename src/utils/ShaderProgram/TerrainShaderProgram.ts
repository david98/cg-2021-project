import { ShaderProgram } from './ShaderProgram'
import { Matrix4, Vector3 } from '@math.gl/core'

import diffuse from '../../textures/terrain/diffuse.png'
import displacement from '../../textures/terrain/displacement.png'
import normal from '../../textures/terrain/normal.png'

export class TerrainShaderProgram extends ShaderProgram {
    private vertices: number[]
    private texCoords: number[]
    private indices: number[]

    private vertexBuffer: WebGLBuffer | null
    private indexBuffer: WebGLBuffer | null
    private texcoordBuffer: WebGLBuffer | null

    private positionAttributeLocation: number
    private texcoordAttributeLocation: number

    private viewMatrixLocation: WebGLUniformLocation | null
    private projMatrixLocation: WebGLUniformLocation | null
    private diffuseLocation: WebGLUniformLocation | null
    private displacementLocation: WebGLUniformLocation | null
    private normalLocation: WebGLUniformLocation | null
    private dirLightLocation: WebGLUniformLocation | null
    private pointLightWorldPositionLocation: WebGLUniformLocation | null

    private diffuse: WebGLTexture | null
    private displacement: WebGLTexture | null
    private normal: WebGLTexture | null

    constructor(args: {
        gl: WebGL2RenderingContext
        vertexShaderSource: string
        fragmentShaderSource: string
    }) {
        super(args)
        let gl = this.gl

        const size = 1000

        this.vertices = [
            -size / 2, // 0
            0,
            size / 2,
            1.0,
            -size / 2, // 1
            0,
            -size / 2,
            1.0,
            size / 2, // 2
            0,
            size / 2,
            1.0,
            size / 2, // 3
            0,
            -size / 2,
            1.0,
        ]
        this.texCoords = [
            0.0,
            0.0,
            0.0,
            size / 4,
            size / 4,
            0.0,
            size / 4,
            size / 4,
        ]
        this.indices = [1, 2, 3, 2, 1, 0]

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

        this.texcoordBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer)
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(this.texCoords),
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
        this.texcoordAttributeLocation = gl.getAttribLocation(
            this.glProgram,
            'a_texcoord'
        )
        gl.enableVertexAttribArray(this.texcoordAttributeLocation)

        this.viewMatrixLocation = gl.getUniformLocation(
            this.glProgram,
            'u_view'
        )
        this.projMatrixLocation = gl.getUniformLocation(
            this.glProgram,
            'u_proj'
        )
        this.diffuseLocation = gl.getUniformLocation(
            this.glProgram,
            'u_diffuse'
        )
        this.displacementLocation = gl.getUniformLocation(
            this.glProgram,
            'u_displacement'
        )
        this.normalLocation = gl.getUniformLocation(this.glProgram, 'u_normal')
        this.dirLightLocation = gl.getUniformLocation(
            this.glProgram,
            'u_directionalLightDir'
        )
        this.pointLightWorldPositionLocation = gl.getUniformLocation(
            this.glProgram,
            'u_lightWorldPosition'
        )

        this.diffuse = gl.createTexture()
        this.loadTexture({
            src: diffuse,
            slot: gl.TEXTURE3,
            target: this.diffuse,
            useAnisotropicFiltering: true,
            dontClamp: true,
        })
        this.displacement = gl.createTexture()
        this.loadTexture({
            src: displacement,
            slot: gl.TEXTURE4,
            target: this.displacement,
            dontClamp: true,
        })
        this.normal = gl.createTexture()
        this.loadTexture({
            src: displacement,
            slot: gl.TEXTURE5,
            target: this.normal,
            dontClamp: true,
        })
    }

    render(args: { viewMatrix: Matrix4; projMatrix: Matrix4 }) {
        super.render(args)

        let gl = this.gl

        gl.uniformMatrix4fv(this.viewMatrixLocation, false, args.viewMatrix)
        gl.uniformMatrix4fv(this.projMatrixLocation, false, args.projMatrix)

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer)

        // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        let size = 4
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

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer)
        gl.vertexAttribPointer(
            this.texcoordAttributeLocation,
            2,
            gl.FLOAT,
            false,
            0,
            0
        )

        gl.uniform1i(this.diffuseLocation, 3)
        gl.uniform1i(this.displacementLocation, 4)
        gl.uniform1i(this.normalLocation, 5)
        gl.uniform3fv(this.dirLightLocation, new Vector3([1, -1, -1]))
        gl.uniform3fv(
            this.pointLightWorldPositionLocation,
            new Vector3([10, 10, 10])
        )

        // Draw the geometry.
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer)
        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0)
    }
}
