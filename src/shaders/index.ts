// @ts-ignore
import sample_fragment from './sample_fragment.glsl'
// @ts-ignore
import sample_vertex from './sample_vertex.glsl'

export let sampleFragment = sample_fragment
export let sampleVertex = sample_vertex

export let loaded = false

const loadShader = async (s: any) => {
    return await (await fetch(s)).text()
}

export const load = async () => {
    if (!loaded) {
        sampleFragment = await loadShader(sampleFragment)
        sampleVertex = await loadShader(sampleVertex)

        loaded = true
    }
}
