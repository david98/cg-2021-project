import { ShaderProgram } from './ShaderProgram'
import { GameObject } from './GameObject'
import textureImg from '../textures/texture.jpg'
import Camera from './Camera'
import { Matrix4, Vector3, Vector4 } from '@math.gl/core'
import { flowerModel } from '../models'

export class EnvironmentShaderProgram extends ShaderProgram {
    private pointLightWorldPositionLocation: WebGLUniformLocation | null
    private textureLocation: WebGLUniformLocation | null
    private worldMatrixLocation: WebGLUniformLocation | null
    private viewMatrixLocation: WebGLUniformLocation | null
    private projMatrixLocation: WebGLUniformLocation | null
    private dirLightLocation: WebGLUniformLocation | null

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
        if (args.gameObj.mesh) {
            let gl = this.gl

            const worldMat = args.gameObj.getTransform()
            gl.uniformMatrix4fv(
                this.worldMatrixLocation,
                false,
                worldMat.multiplyRight(args.parentTransform)
            )

            gl.bindBuffer(gl.ARRAY_BUFFER, args.gameObj.mesh.vertexBuffer)
            gl.vertexAttribPointer(
                this.positionAttributeLocation,
                flowerModel.vertexBuffer.itemSize,
                gl.FLOAT,
                false,
                0,
                0
            )

            gl.bindBuffer(gl.ARRAY_BUFFER, args.gameObj.mesh.normalBuffer)
            gl.vertexAttribPointer(
                this.normalAttributeLocation,
                flowerModel.normalBuffer.itemSize,
                gl.FLOAT,
                false,
                0,
                0
            )

            gl.bindBuffer(gl.ARRAY_BUFFER, args.gameObj.mesh.textureBuffer)
            gl.vertexAttribPointer(
                this.texcoordAttributeLocation,
                2,
                gl.FLOAT,
                true,
                0,
                0
            )

            let primitiveType = gl.TRIANGLES
            let offset = 0

            gl.bindBuffer(
                gl.ELEMENT_ARRAY_BUFFER,
                args.gameObj.mesh.indexBuffer
            )
            gl.activeTexture(gl.TEXTURE1)
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
        if (args.gameObj.mesh) {
            let gl = this.gl
            gl.useProgram(this.glProgram)

            const worldMat = args.gameObj.getTransform()
            gl.uniformMatrix4fv(this.worldMatrixLocation, false, worldMat)
            gl.uniformMatrix4fv(this.viewMatrixLocation, false, args.viewMatrix)
            gl.uniformMatrix4fv(this.projMatrixLocation, false, args.projMatrix)
            gl.uniform3fv(this.dirLightLocation, new Vector3([1, -1, -1]))
            gl.uniform3fv(
                this.pointLightWorldPositionLocation,
                new Vector4([10, 10, 10, 1])
            )
            gl.uniform1i(this.textureLocation, 1)

            gl.bindBuffer(gl.ARRAY_BUFFER, args.gameObj.mesh.vertexBuffer)
            gl.vertexAttribPointer(
                this.positionAttributeLocation,
                flowerModel.vertexBuffer.itemSize,
                gl.FLOAT,
                false,
                0,
                0
            )

            gl.bindBuffer(gl.ARRAY_BUFFER, args.gameObj.mesh.normalBuffer)
            gl.vertexAttribPointer(
                this.normalAttributeLocation,
                flowerModel.normalBuffer.itemSize,
                gl.FLOAT,
                false,
                0,
                0
            )

            gl.bindBuffer(gl.ARRAY_BUFFER, args.gameObj.mesh.textureBuffer)
            gl.vertexAttribPointer(
                this.texcoordAttributeLocation,
                2,
                gl.FLOAT,
                true,
                0,
                0
            )

            let primitiveType = gl.TRIANGLES
            let offset = 0

            gl.bindBuffer(
                gl.ELEMENT_ARRAY_BUFFER,
                args.gameObj.mesh.indexBuffer
            )
            gl.activeTexture(gl.TEXTURE1)
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

    public setup() {}
}
