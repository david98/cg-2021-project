import { createProgram, createShader } from './index'
import { Matrix4 } from '@math.gl/core'

export abstract class ShaderProgram {
    public gl: WebGL2RenderingContext
    public glProgram: WebGLProgram | null = null

    protected constructor(args: {
        gl: WebGL2RenderingContext
        vertexShaderSource: string
        fragmentShaderSource: string
    }) {
        this.gl = args.gl
        let program = this.gl.createProgram()
        if (program) {
            let vertexShader = createShader(
                this.gl,
                this.gl.VERTEX_SHADER,
                args.vertexShaderSource
            )
            let fragmentShader = createShader(
                this.gl,
                this.gl.FRAGMENT_SHADER,
                args.fragmentShaderSource
            )
            if (!(vertexShader && fragmentShader)) {
                console.error('Error while creating fragment/vertex shaders.')
                return
            }
            let program = createProgram(this.gl, vertexShader, fragmentShader)

            if (!program) {
                console.error('Error while creating program.')
                return
            }
            this.glProgram = program

            this.gl.useProgram(this.glProgram)
        }
    }

    public render(args: { viewMatrix: Matrix4; projMatrix: Matrix4 }): void {
        this.gl.useProgram(this.glProgram)
    }

    public setup(): void {
        throw new Error('setup is not implemented')
    }
}
