#version 300 es

precision highp float;

in vec2 v_texcoord;
in mat4 fs_camera_mat;
in mat4 fs_invtrans_camera_mat;
in vec4 fs_normal;
in vec4 fs_pos;
in vec3 v_surfaceToLight;

uniform sampler2D u_diffuse;
uniform vec3 u_directionalLightDir;

out vec4 outColor;

void main() {
    vec3 normal = normalize(fs_normal).xyz;
    vec3 dirLightDir = normalize(mat3(fs_camera_mat) * -u_directionalLightDir);


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

    // OlightDir = normalize(v_surfaceToLight);

    outColor = texture(u_diffuse, v_texcoord) + lightColor * decayAmount * fWin + clamp(dot(normal, dirLightDir), 0.0f, 1.0f) * lightColor;
    outColor.w = 1.0f;
}
