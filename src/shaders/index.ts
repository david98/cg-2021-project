// @ts-ignore
import sample_fragment from './sample_fragment.glsl'
// @ts-ignore
import sample_vertex from './sample_vertex.glsl'
// @ts-ignore
import skybox_vertex from './skybox_vertex.glsl'
// @ts-ignore
import skybox_fragment from './skybox_fragment.glsl'
// @ts-ignore
import picker_vertex from './picker_vertex.glsl'
// @ts-ignore
import picker_fragment from './picker_fragment.glsl'

export let sampleFragment = sample_fragment
export let sampleVertex = sample_vertex
export let skyboxVertex = skybox_vertex
export let skyboxFragment = skybox_fragment
export let pickerVertex = picker_vertex
export let pickerFragment = picker_fragment

export let loaded = false

const loadShader = async (s: any) => {
    return await (await fetch(s)).text()
}

export const load = async () => {
    if (!loaded) {
        sampleFragment = await loadShader(sampleFragment)
        sampleVertex = await loadShader(sampleVertex)
        skyboxVertex = await loadShader(skyboxVertex)
        skyboxFragment = await loadShader(skyboxFragment)
        pickerVertex = await loadShader(pickerVertex)
        pickerFragment = await loadShader(pickerFragment)

        loaded = true
    }
}
