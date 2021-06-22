#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

in vec4 fs_normal;
in vec4 fs_pos;
in mat4 fs_camera_mat;
in mat4 fs_invtrans_camera_mat;

uniform vec4 u_color;
uniform vec3 u_directionalLightDir;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
    vec3 normal = normalize(fs_normal).xyz;
    vec3 dirLightDir = normalize(mat3(fs_camera_mat) * u_directionalLightDir);
    float light = dot(normal, dirLightDir);
    // float light = dirLightDir.x;

    outColor = light * u_color + vec4(0.3, 0.2, 0.2, 1.0); // TODO: add shadow color
}