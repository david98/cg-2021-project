#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

in vec3 v_surfaceToLight;
in vec4 fs_normal;
in vec4 fs_pos;
in mat4 fs_camera_mat;
in mat4 fs_invtrans_camera_mat;
in vec2 v_texcoord;

uniform vec4 u_lightColor;
uniform vec3 u_directionalLightDir;
uniform sampler2D u_texture;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
    vec3 normal = normalize(fs_normal).xyz;
    vec3 dirLightDir = normalize(mat3(fs_camera_mat) * -u_directionalLightDir);
    float light = dot(normal, dirLightDir) + dot(normal, v_surfaceToLight);

    outColor = clamp(light, 0.0, 1.0) * u_lightColor + texture(u_texture, v_texcoord); // TODO: add shadow color
    // outColor = vec4(1, 0, 0, 1);
}