#version 300 es

in vec4 a_position;
in vec2 a_texcoord;

uniform vec3 u_lightWorldPosition;
uniform mat4 u_view;
uniform mat4 u_proj;
uniform sampler2D u_displacement;
uniform sampler2D u_normal;

out vec2 v_texcoord;
out vec4 fs_pos;
out mat4 fs_camera_mat;
out mat4 fs_invtrans_camera_mat;
out vec3 v_surfaceToLight;
out vec4 fs_normal;

void main() {
    gl_Position = u_proj * u_view * (a_position + texture(u_displacement, a_texcoord));
    v_texcoord = a_texcoord;

    mat4 invtrans_camera_mat = transpose(inverse(u_view));

    fs_pos = u_view * (a_position + texture(u_displacement, a_texcoord));
    fs_normal = invtrans_camera_mat * texture(u_normal, a_texcoord);
    fs_camera_mat = u_view;
    fs_invtrans_camera_mat = invtrans_camera_mat;
    v_surfaceToLight = (u_view * vec4(u_lightWorldPosition, 1)).xyz - fs_pos.xyz;
}
