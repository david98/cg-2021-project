import { ShaderProgram } from './ShaderProgram'
import posx from '../../textures/skybox/posx.jpg'
import negx from '../../textures/skybox/negx.jpg'
import posy from '../../textures/skybox/posy.jpg'
import negy from '../../textures/skybox/negy.jpg'
import posz from '../../textures/skybox/posz.jpg'
import negz from '../../textures/skybox/negz.jpg'
import { Matrix4 } from '@math.gl/core'

export class SkyboxShaderProgram extends ShaderProgram {
    private vao: WebGLVertexArrayObject | null

    private positionAttributeLocation: number

    private textureLocation: WebGLUniformLocation | null
    private viewDirectionProjectionInverseLocation: WebGLUniformLocation | null

    private texture: WebGLTexture | null

    private positionBuffer: WebGLBuffer | null

    private loadSkybox() {
        let gl = this.gl
        // Create a texture.
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture)

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
            const width = 2048
            const height = 2048
            const format = gl.RGBA
            const type = gl.UNSIGNED_BYTE

            // setup each face so it's immediately renderable
            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture)
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
            image.addEventListener('load', () => {
                // Now that the image has loaded make copy it to the texture.
                gl.activeTexture(gl.TEXTURE0)
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture)
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

    constructor(args: {
        gl: WebGL2RenderingContext
        vertexShaderSource: string
        fragmentShaderSource: string
    }) {
        super(args)
        if (!this.glProgram) {
            throw Error('Program error')
        }

        let gl = this.gl
        this.vao = gl.createVertexArray()
        this.texture = gl.createTexture()

        this.textureLocation = gl.getUniformLocation(this.glProgram, 'u_skybox')
        this.viewDirectionProjectionInverseLocation = gl.getUniformLocation(
            this.glProgram,
            'u_viewDirectionProjectionInverse'
        )

        this.positionAttributeLocation = gl.getAttribLocation(
            this.glProgram,
            'a_position'
        )

        for (let i = 0; i < 16; i++) {
            gl.disableVertexAttribArray(i)
        }

        gl.enableVertexAttribArray(this.positionAttributeLocation)

        // Tell the shader to use texture unit 0 for u_skybox
        gl.uniform1i(this.textureLocation, 0)

        // Create a buffer for positions
        this.positionBuffer = gl.createBuffer()
        // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer)
        // Put the positions in the buffer
        let positions = new Float32Array([
            -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
        ])
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

        this.loadSkybox()
    }

    protected updateLocations() {
        super.updateLocations()
        let gl = this.gl

        if (this.glProgram) {
            this.textureLocation = gl.getUniformLocation(
                this.glProgram,
                'u_skybox'
            )

            this.viewDirectionProjectionInverseLocation = gl.getUniformLocation(
                this.glProgram,
                'u_viewDirectionProjectionInverse'
            )

            this.positionAttributeLocation = gl.getAttribLocation(
                this.glProgram,
                'a_position'
            )

            gl.enableVertexAttribArray(this.positionAttributeLocation)

            gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer)
            let positions = new Float32Array([
                -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
            ])
            gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)
        }
    }

    public render(args: { viewMatrix: Matrix4; projMatrix: Matrix4 }) {
        super.render(args)

        let gl = this.gl

        // Bind the position buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer)

        // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        let size = 2 // 2 components per iteration
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

        let viewDirectionProjectionMatrix = args.projMatrix
            .clone()
            .multiplyRight(args.viewMatrix)
        let viewDirectionProjectionInverseMatrix =
            viewDirectionProjectionMatrix.invert()

        // Set the uniforms
        gl.uniformMatrix4fv(
            this.viewDirectionProjectionInverseLocation,
            false,
            viewDirectionProjectionInverseMatrix
        )

        // Draw the geometry.
        gl.drawArrays(gl.TRIANGLES, 0, 6)
    }
}
