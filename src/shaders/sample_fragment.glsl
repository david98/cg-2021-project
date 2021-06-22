#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

in vec3 fs_normal;
in vec3 fs_pos;

uniform vec4 u_color;
uniform vec3 u_directionalLightDir;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
    vec3 normal = normalize(fs_normal);
    float light = dot(normal, -u_directionalLightDir);
    // Just set the output to a constant reddish-purple
    outColor = light * u_color;
}