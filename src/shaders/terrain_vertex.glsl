#version 300 es

in vec4 a_position;
in vec2 a_texcoord;

uniform mat4 u_view;
uniform mat4 u_proj;

out vec2 v_texcoord;

void main() {
    gl_Position = u_proj * u_view * a_position;
    v_texcoord = a_texcoord;
}
