#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
layout (location = 0) in vec3 a_position;
in vec3 a_normal;
in vec2 a_texcoord;

uniform vec3 u_lightWorldPosition;

uniform mat4 u_world;
uniform mat4 u_view;
uniform mat4 u_proj;

out vec4 fs_normal;
out vec4 fs_pos;
out mat4 fs_camera_mat;
out mat4 fs_invtrans_camera_mat;
out vec3 v_surfaceToLight;
out vec2 v_texcoord;

// all shaders have a main function
void main() {

    // gl_Position is a special variable a vertex shader
    // is responsible for setting
    gl_Position = u_proj * u_view * u_world * vec4(a_position, 1.0f);

    mat4 invtrans_camera_mat = transpose(inverse(u_view * u_world));

    fs_normal = invtrans_camera_mat * vec4(a_normal, 1.0f);
    fs_pos = u_view * u_world * vec4(a_position, 1.0f);
    fs_camera_mat = u_view;
    fs_invtrans_camera_mat = invtrans_camera_mat;

    // compute the vector of the surface to the light
    // and pass it to the fragment shader
    v_surfaceToLight = (u_view * vec4(u_lightWorldPosition, 1)).xyz - fs_pos.xyz;

    v_texcoord = a_texcoord;
}