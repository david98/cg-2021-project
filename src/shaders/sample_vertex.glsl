#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec4 a_position;
in vec4 a_normal;

uniform mat4 u_world;
uniform mat4 u_view;
uniform mat4 u_proj;

out vec4 fs_normal;
out vec4 fs_pos;
out mat4 fs_camera_mat;
out mat4 fs_invtrans_camera_mat;

// all shaders have a main function
void main() {

    // gl_Position is a special variable a vertex shader
    // is responsible for setting
    gl_Position = u_proj * u_view * u_world * a_position;

    mat4 invtrans_camera_mat = transpose(inverse(u_view * u_world));

    fs_normal = invtrans_camera_mat * a_normal; // TODO: do this in client code
    fs_pos = u_view * u_world * a_position;
    fs_camera_mat = u_view;
    fs_invtrans_camera_mat = invtrans_camera_mat;
}