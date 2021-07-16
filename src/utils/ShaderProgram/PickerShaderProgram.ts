import { ShaderProgram } from './ShaderProgram'
import { Matrix4, Vector4 } from '@math.gl/core'
import { GameObject } from '../GameObject'

export class PickerShaderProgram extends ShaderProgram {
    private worldMatrixLocation: WebGLUniformLocation | null
    private viewMatrixLocation: WebGLUniformLocation | null
    private projMatrixLocation: WebGLUniformLocation | null
    private idLocation: WebGLUniformLocation | null

    private positionAttributeLocation: number

    private targetTexture: WebGLTexture | null

    private depthBuffer: WebGLRenderbuffer | null

    private frameBuffer: WebGLFramebuffer | null

    private setFramebufferAttachmentSizes(width: number, height: number) {
        let gl = this.gl

        gl.bindTexture(gl.TEXTURE_2D, this.targetTexture)
        // define size and format of level 0
        const level = 0
        const internalFormat = gl.RGBA
        const border = 0
        const format = gl.RGBA
        const type = gl.UNSIGNED_BYTE
        const data = null
        gl.texImage2D(
            gl.TEXTURE_2D,
            level,
            internalFormat,
            width,
            height,
            border,
            format,
            type,
            data
        )

        gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer)
        gl.renderbufferStorage(
            gl.RENDERBUFFER,
            gl.DEPTH_COMPONENT16,
            width,
            height
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

        gl.activeTexture(gl.TEXTURE10)
        this.targetTexture = gl.createTexture()

        gl.bindTexture(gl.TEXTURE_2D, this.targetTexture)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

        // create a depth renderbuffer
        this.depthBuffer = gl.createRenderbuffer()
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer)

        // Create and bind the framebuffer
        this.frameBuffer = gl.createFramebuffer()
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer)

        // attach the texture as the first color attachment
        const attachmentPoint = gl.COLOR_ATTACHMENT0
        const level = 0
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            attachmentPoint,
            gl.TEXTURE_2D,
            this.targetTexture,
            level
        )

        // make a depth buffer and the same size as the targetTexture
        gl.framebufferRenderbuffer(
            gl.FRAMEBUFFER,
            gl.DEPTH_ATTACHMENT,
            gl.RENDERBUFFER,
            this.depthBuffer
        )
        // TODO: handle resize
        this.setFramebufferAttachmentSizes(gl.canvas.width, gl.canvas.height)

        this.worldMatrixLocation = gl.getUniformLocation(
            this.glProgram,
            'u_world'
        )
        this.viewMatrixLocation = gl.getUniformLocation(
            this.glProgram,
            'u_view'
        )
        this.projMatrixLocation = gl.getUniformLocation(
            this.glProgram,
            'u_proj'
        )
        this.idLocation = gl.getUniformLocation(this.glProgram, 'u_id')

        this.positionAttributeLocation = gl.getAttribLocation(
            this.glProgram,
            'a_position'
        )

        gl.enableVertexAttribArray(this.positionAttributeLocation)

        gl.bindRenderbuffer(gl.RENDERBUFFER, null)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    }

    private renderRecursive(args: {
        gameObj: GameObject
        parentTransform: Matrix4
    }) {
        let gl = this.gl
        gl.useProgram(this.glProgram)

        const worldMat = args.gameObj.getTransform()
        gl.uniformMatrix4fv(
            this.worldMatrixLocation,
            false,
            worldMat.multiplyRight(args.parentTransform)
        )

        if (args.gameObj.mesh) {
            gl.uniform4fv(this.idLocation, new Vector4([0.5, 0.5, 0.5, 1]))

            gl.bindBuffer(gl.ARRAY_BUFFER, args.gameObj.mesh.vertexBuffer)
            gl.vertexAttribPointer(
                this.positionAttributeLocation,
                args.gameObj.mesh.vertexBuffer.itemSize,
                gl.FLOAT,
                false,
                0,
                0
            )

            let primitiveType = gl.TRIANGLES
            let offset = 0

            gl.bindBuffer(
                gl.ELEMENT_ARRAY_BUFFER,
                args.gameObj.mesh.indexBuffer
            )
            gl.drawElements(
                primitiveType,
                args.gameObj.mesh.indexBuffer.numItems,
                gl.UNSIGNED_SHORT,
                offset
            )
        }

        for (let child of args.gameObj.children) {
            this.renderRecursive({
                gameObj: child,
                parentTransform: new Matrix4()
                    .fromQuaternion(args.gameObj.orientation)
                    .translate(args.gameObj.position),
            })
        }
    }

    public render(args: {
        gameObj: GameObject
        viewMatrix: Matrix4
        projMatrix: Matrix4
    }) {
        super.render(args)

        let gl = this.gl
        gl.activeTexture(gl.TEXTURE10)

        gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer)
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer)
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            this.targetTexture,
            0
        )

        // Clear the canvas
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.DEPTH_BUFFER_BIT)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

        gl.enable(gl.CULL_FACE)
        gl.enable(gl.DEPTH_TEST)

        // Clear the canvas AND the depth buffer.
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        // Render to framebuffer
        const worldMat = args.gameObj.getTransform()

        gl.uniformMatrix4fv(this.worldMatrixLocation, false, worldMat)
        gl.uniformMatrix4fv(this.viewMatrixLocation, false, args.viewMatrix)
        gl.uniformMatrix4fv(this.projMatrixLocation, false, args.projMatrix)

        this.renderRecursive({
            gameObj: args.gameObj,
            parentTransform: new Matrix4().identity(),
        })

        gl.bindRenderbuffer(gl.RENDERBUFFER, null)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    }

    public readID(): number | undefined {
        let gl = this.gl
        if ('clientHeight' in gl.canvas && 'clientWidth' in gl.canvas) {
            gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer)
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer)
            gl.framebufferTexture2D(
                gl.FRAMEBUFFER,
                gl.COLOR_ATTACHMENT0,
                gl.TEXTURE_2D,
                this.targetTexture,
                0
            )
            gl.readBuffer(gl.COLOR_ATTACHMENT0)

            const data = new Uint8Array(4)
            gl.readPixels(
                gl.canvas.width / 2, // x
                gl.canvas.height / 2, // y
                1, // width
                1, // height
                gl.RGBA, // format
                gl.UNSIGNED_BYTE, // type
                data
            ) // typed array to hold result

            let err = gl.getError()
            if (err !== 0) {
                console.log(err)
            }

            const id =
                data[0] + (data[1] << 8) + (data[2] << 16) + (data[3] << 24)
            gl.bindRenderbuffer(gl.RENDERBUFFER, null)
            gl.bindFramebuffer(gl.FRAMEBUFFER, null)
            return id
        }
    }
}
