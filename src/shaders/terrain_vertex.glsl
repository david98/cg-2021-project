#version 300 es

in vec4 a_position;
in vec2 a_texcoord;

uniform mat4 u_view;
uniform mat4 u_proj;
uniform mat3 u_normalMatrix;
uniform sampler2D u_displacement;
uniform sampler2D u_normal;

out vec2 v_texcoord;
out vec4 fs_pos;
out mat4 fs_view;
out vec3 fs_normal;

void main() {
    gl_Position = u_proj * u_view * (a_position + texture(u_displacement, a_texcoord));
    v_texcoord = a_texcoord;

    fs_pos = u_view * (a_position + texture(u_displacement, a_texcoord));
    fs_normal = u_normalMatrix * texture(u_normal, a_texcoord).xyz;
    fs_view = u_view;
}
