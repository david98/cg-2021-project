import { createProgram, createShader } from './index'
import { GameObject } from './GameObject'
import Camera from './Camera'
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
        }
    }

    public render(args: {
        gameObj: GameObject
        viewMatrix: Matrix4
        projMatrix: Matrix4
    }): void {
        throw new Error('render is not implemented')
    }

    public setup(): void {
        throw new Error('setup is not implemented')
    }
}
