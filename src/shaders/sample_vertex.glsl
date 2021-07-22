#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
layout (location = 0) in vec3 a_position;
in vec3 a_normal;
in vec2 a_texcoord;

uniform mat4 u_world;
uniform mat4 u_view;
uniform mat4 u_proj;
uniform mat3 u_normalMatrix;

out vec3 fs_normal;
out vec4 fs_pos;
out mat4 fs_view;
out vec3 v_surfaceToLight;
out vec2 v_texcoord;

// all shaders have a main function
void main() {

    // gl_Position is a special variable a vertex shader
    // is responsible for setting
    gl_Position = u_proj * u_view * u_world * vec4(a_position, 1.0f);

    fs_normal = u_normalMatrix * a_normal;
    fs_pos = u_view * u_world * vec4(a_position, 1.0f);
    fs_view = u_view;

    v_texcoord = a_texcoord;
}