import { createProgram, createShader } from '../index'
import { Matrix4 } from '@math.gl/core'
import textureImg from '../../textures/texture.jpg'

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

    protected updateLocations(): void {}

    protected loadTexture(args: {
        src: string
        target: WebGLTexture | null
        slot: number
        useAnisotropicFiltering?: boolean
        dontClamp?: boolean
        dontGenerateMipmaps?: boolean
    }): void {
        let gl = this.gl
        gl.activeTexture(args.slot)
        gl.bindTexture(gl.TEXTURE_2D, args.target)

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
        image.src = args.src
        image.addEventListener('load', () => {
            // Now that the image has loaded make copy it to the texture.
            gl.activeTexture(args.slot)
            gl.bindTexture(gl.TEXTURE_2D, args.target)
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                image
            )
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
            if (args.useAnisotropicFiltering) {
                let ext =
                    gl.getExtension('EXT_texture_filter_anisotropic') ||
                    gl.getExtension('MOZ_EXT_texture_filter_anisotropic') ||
                    gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic')
                if (ext) {
                    let max = gl.getParameter(
                        ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT
                    )
                    gl.texParameterf(
                        gl.TEXTURE_2D,
                        ext.TEXTURE_MAX_ANISOTROPY_EXT,
                        max
                    )
                }
            } else {
                gl.texParameteri(
                    gl.TEXTURE_2D,
                    gl.TEXTURE_MAG_FILTER,
                    gl.LINEAR
                )
                gl.texParameteri(
                    gl.TEXTURE_2D,
                    gl.TEXTURE_MIN_FILTER,
                    gl.LINEAR
                )
            }
            if (!args.dontGenerateMipmaps) {
                gl.generateMipmap(gl.TEXTURE_2D)
            }

            if (args.dontClamp) {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
            } else {
                gl.texParameteri(
                    gl.TEXTURE_2D,
                    gl.TEXTURE_WRAP_S,
                    gl.CLAMP_TO_EDGE
                )
                gl.texParameteri(
                    gl.TEXTURE_2D,
                    gl.TEXTURE_WRAP_T,
                    gl.CLAMP_TO_EDGE
                )
            }
        })
    }

    public render(args: { viewMatrix: Matrix4; projMatrix: Matrix4 }): void {
        this.gl.useProgram(this.glProgram)
    }

    public setup(): void {
        throw new Error('setup is not implemented')
    }
}
