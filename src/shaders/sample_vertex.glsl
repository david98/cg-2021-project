#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec4 a_position;
in vec4 a_normal;

uniform mat4 u_world;
uniform mat4 u_view;
uniform mat4 u_proj;

out vec3 fs_normal;

// all shaders have a main function
void main() {

    // gl_Position is a special variable a vertex shader
    // is responsible for setting
    gl_Position = u_proj * u_view * u_world * a_position;

    fs_normal = a_normal.xyz;
}