export function createShader(
    gl: WebGL2RenderingContext,
    type: number,
    source: string
) {
    var shader = gl.createShader(type)
    if (shader) {
        gl.shaderSource(shader, source)
        gl.compileShader(shader)
        var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS)
        if (success) {
            return shader
        }

        console.log(gl.getShaderInfoLog(shader))
        gl.deleteShader(shader)
    }
}

export function createProgram(
    gl: WebGL2RenderingContext,
    vertexShader: any,
    fragmentShader: any
) {
    let program = gl.createProgram()
    if (program) {
        gl.attachShader(program, vertexShader)
        gl.attachShader(program, fragmentShader)
        gl.linkProgram(program)
        var success = gl.getProgramParameter(program, gl.LINK_STATUS)
        if (success) {
            return program
        }
        console.log(gl.getProgramInfoLog(program))
        gl.deleteProgram(program)
    }
}

export const degToRad = (deg: number) => {
    return (deg * Math.PI) / 180
}

export {}
