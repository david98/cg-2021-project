// @ts-ignore
import flower from './flower.obj'
import { OBJ } from 'webgl-obj-loader'

export let flowerModel = flower

const loadModel = async (m: any) => {
    return await (await fetch(m)).text()
}

export const load = async () => {
    if (!loaded) {
        flowerModel = new OBJ.Mesh(await loadModel(flowerModel))

        loaded = true
    }
}

export let loaded = false
