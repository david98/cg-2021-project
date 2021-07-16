#version 300 es

precision highp float;

layout (location = 0) in vec4 a_position; // don't know why but it won't work else

uniform mat4 u_world;
uniform mat4 u_view;
uniform mat4 u_proj;

out vec4 v_color;

void main() {
    // Multiply the position by the matrix.
    gl_Position = u_proj * u_view * u_world * a_position;
}