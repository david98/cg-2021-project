import { ShaderProgram } from './ShaderProgram'
import { GameObject } from '../GameObject'
import textureImg from '../../textures/texture.jpg'
import birdTextureImg from '../../textures/texture_bird.png'
import { Matrix3, Matrix4, Vector3, Vector4 } from '@math.gl/core'

export class EnvironmentShaderProgram extends ShaderProgram {
    private pointLightPositionLocation: WebGLUniformLocation | null
    private textureLocation: WebGLUniformLocation | null
    private worldMatrixLocation: WebGLUniformLocation | null
    private viewMatrixLocation: WebGLUniformLocation | null
    private projMatrixLocation: WebGLUniformLocation | null
    private normalMatrixLocation: WebGLUniformLocation | null
    private dirLightLocation: WebGLUniformLocation | null
    private lightColorLocation: WebGLUniformLocation | null

    private texcoordAttributeLocation: number
    private positionAttributeLocation: number
    private normalAttributeLocation: number

    private vegetationTexture: WebGLTexture | null
    private birdTexture: WebGLTexture | null

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

        this.pointLightPositionLocation = gl.getUniformLocation(
            this.glProgram,
            'u_pointLightPosition'
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
        this.normalMatrixLocation = gl.getUniformLocation(
            this.glProgram,
            'u_normalMatrix'
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

        this.vegetationTexture = gl.createTexture()
        this.loadTexture({
            src: textureImg,
            target: this.vegetationTexture,
            slot: gl.TEXTURE1,
        })

        this.birdTexture = gl.createTexture()
        this.loadTexture({
            src: birdTextureImg,
            target: this.birdTexture,
            slot: gl.TEXTURE2,
        })
    }

    private renderRecursive(args: {
        gameObj: GameObject
        parentTransform: Matrix4
    }) {
        let gl = this.gl
        gl.useProgram(this.glProgram)
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

        const worldMat = args.gameObj.getTransform()
        gl.uniformMatrix4fv(
            this.worldMatrixLocation,
            false,
            worldMat.multiplyRight(args.parentTransform)
        )

        if (args.gameObj.mesh) {
            gl.uniform1i(
                this.textureLocation,
                args.gameObj.textureSlot - gl.TEXTURE0
            )

            gl.bindBuffer(gl.ARRAY_BUFFER, args.gameObj.mesh.vertexBuffer)
            gl.vertexAttribPointer(
                this.positionAttributeLocation,
                args.gameObj.mesh.vertexBuffer.itemSize,
                gl.FLOAT,
                false,
                0,
                0
            )

            gl.bindBuffer(gl.ARRAY_BUFFER, args.gameObj.mesh.normalBuffer)
            gl.vertexAttribPointer(
                this.normalAttributeLocation,
                args.gameObj.mesh.normalBuffer.itemSize,
                gl.FLOAT,
                false,
                0,
                0
            )

            gl.bindBuffer(gl.ARRAY_BUFFER, args.gameObj.mesh.textureBuffer)
            gl.vertexAttribPointer(
                this.texcoordAttributeLocation,
                args.gameObj.mesh.textureBuffer.itemSize,
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
            gl.activeTexture(args.gameObj.textureSlot)
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
        normalMatrix: Matrix3
    }) {
        super.render(args)
        let gl = this.gl

        const worldMat = args.gameObj.getTransform()
        gl.uniformMatrix4fv(this.worldMatrixLocation, false, worldMat)
        gl.uniformMatrix4fv(this.viewMatrixLocation, false, args.viewMatrix)
        gl.uniformMatrix4fv(this.projMatrixLocation, false, args.projMatrix)
        gl.uniformMatrix3fv(this.normalMatrixLocation, false, args.normalMatrix)
        gl.uniform3fv(
            this.dirLightLocation,
            new Vector3([1, 0.5, 1]).transformByMatrix3(args.normalMatrix)
        )
        gl.uniform4fv(this.lightColorLocation, new Vector4([1, 0.5, 0, 1]))
        gl.uniform3fv(this.pointLightPositionLocation, new Vector3([0, 0, 0]))

        this.renderRecursive({
            gameObj: args.gameObj,
            parentTransform: new Matrix4().identity(),
        })
    }

    public setup() {}
}
