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

    float targetDistance = 10.0f;
    float decayFactor = 1.0f;
    vec4 lightColor = vec4(0.3, 0.7, 0.7, 1.0);
    float r = length(v_surfaceToLight);
    /*
      * CryEngine and Frostbite clamp the distance from the light source to a minimum which is
     * usually the diameter of the light source
     */
    float decayAmount = pow(targetDistance / max(r, .5f), decayFactor);
    /*
     * The windowing function gracefully cuts off light at rmax
     */
    float fWin = pow(max((1.0f - pow((r / (targetDistance * 10.0f)), 4.0f)), 0.0f), 2.0f);

    outColor = texture(u_texture, v_texcoord) + lightColor * decayAmount * fWin + clamp(dot(normal, dirLightDir), 0.0f, 1.0f) * lightColor;
    outColor.w = 1.0f;
}