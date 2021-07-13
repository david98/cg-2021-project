import { ShaderProgram } from './ShaderProgram'
import { GameObject } from './GameObject'
import textureImg from '../textures/texture.jpg'
import { Matrix4, Vector3, Vector4 } from '@math.gl/core'

export class EnvironmentShaderProgram extends ShaderProgram {
    private pointLightWorldPositionLocation: WebGLUniformLocation | null
    private textureLocation: WebGLUniformLocation | null
    private worldMatrixLocation: WebGLUniformLocation | null
    private viewMatrixLocation: WebGLUniformLocation | null
    private projMatrixLocation: WebGLUniformLocation | null
    private dirLightLocation: WebGLUniformLocation | null
    private lightColorLocation: WebGLUniformLocation | null

    private texcoordAttributeLocation: number
    private positionAttributeLocation: number
    private normalAttributeLocation: number

    private texture: WebGLTexture | null

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

        this.pointLightWorldPositionLocation = gl.getUniformLocation(
            this.glProgram,
            'u_lightWorldPosition'
        )
        this.textureLocation = gl.getUniformLocation(
            this.glProgram,
            'u_texture'
        )
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
        this.dirLightLocation = gl.getUniformLocation(
            this.glProgram,
            'u_directionalLightDir'
        )
        this.lightColorLocation = gl.getUniformLocation(
            this.glProgram,
            'u_lightColor'
        )

        this.texcoordAttributeLocation = gl.getAttribLocation(
            this.glProgram,
            'a_texcoord'
        )
        this.positionAttributeLocation = gl.getAttribLocation(
            this.glProgram,
            'a_position'
        )
        this.normalAttributeLocation = gl.getAttribLocation(
            this.glProgram,
            'a_normal'
        )

        gl.enableVertexAttribArray(this.positionAttributeLocation)
        gl.enableVertexAttribArray(this.normalAttributeLocation)
        gl.enableVertexAttribArray(this.texcoordAttributeLocation)

        this.texture = gl.createTexture()
        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, this.texture)

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
        image.addEventListener('load', () => {
            // Now that the image has loaded make copy it to the texture.
            gl.activeTexture(gl.TEXTURE1)
            gl.bindTexture(gl.TEXTURE_2D, this.texture)
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                image
            )
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
            gl.generateMipmap(gl.TEXTURE_2D)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        })
    }

    private renderRecursive(args: {
        gameObj: GameObject
        parentTransform: Matrix4
    }) {
        let gl = this.gl
        gl.useProgram(this.glProgram)
        this.debug()

        const worldMat = args.gameObj.getTransform()
        gl.uniformMatrix4fv(
            this.worldMatrixLocation,
            false,
            worldMat.multiplyRight(args.parentTransform)
        )
        this.debug()

        if (args.gameObj.mesh) {
            gl.bindBuffer(gl.ARRAY_BUFFER, args.gameObj.mesh.vertexBuffer)
            this.debug()
            gl.vertexAttribPointer(
                this.positionAttributeLocation,
                args.gameObj.mesh.vertexBuffer.itemSize,
                gl.FLOAT,
                false,
                0,
                0
            )
            this.debug()

            gl.bindBuffer(gl.ARRAY_BUFFER, args.gameObj.mesh.normalBuffer)
            this.debug()
            gl.vertexAttribPointer(
                this.normalAttributeLocation,
                args.gameObj.mesh.normalBuffer.itemSize,
                gl.FLOAT,
                false,
                0,
                0
            )
            this.debug()

            gl.bindBuffer(gl.ARRAY_BUFFER, args.gameObj.mesh.textureBuffer)
            this.debug()
            gl.vertexAttribPointer(
                this.texcoordAttributeLocation,
                args.gameObj.mesh.textureBuffer.itemSize,
                gl.FLOAT,
                true,
                0,
                0
            )
            this.debug()

            let primitiveType = gl.TRIANGLES
            let offset = 0

            gl.bindBuffer(
                gl.ELEMENT_ARRAY_BUFFER,
                args.gameObj.mesh.indexBuffer
            )
            this.debug()
            gl.activeTexture(gl.TEXTURE1)
            this.debug()
            gl.drawElements(
                primitiveType,
                args.gameObj.mesh.indexBuffer.numItems,
                gl.UNSIGNED_SHORT,
                offset
            )
            this.debug()
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

    private debug() {
        let err = this.gl.getError()
        if (err !== 0) {
            console.log(err)
        }
    }

    public render(args: {
        gameObj: GameObject
        viewMatrix: Matrix4
        projMatrix: Matrix4
    }) {
        let gl = this.gl
        gl.useProgram(this.glProgram)

        const worldMat = args.gameObj.getTransform()
        gl.uniformMatrix4fv(this.worldMatrixLocation, false, worldMat)
        gl.uniformMatrix4fv(this.viewMatrixLocation, false, args.viewMatrix)
        gl.uniformMatrix4fv(this.projMatrixLocation, false, args.projMatrix)
        gl.uniform3fv(this.dirLightLocation, new Vector3([1, -1, -1]))
        gl.uniform4fv(this.lightColorLocation, new Vector4([1, 0, 0, 1]))
        gl.uniform3fv(
            this.pointLightWorldPositionLocation,
            new Vector3([10, 10, 10])
        )
        gl.uniform1i(this.textureLocation, 1)

        this.renderRecursive({
            gameObj: args.gameObj,
            parentTransform: new Matrix4().identity(),
        })
    }

    public setup() {}
}
