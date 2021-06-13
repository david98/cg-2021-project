// @ts-ignore
import flower from './flower.obj'
// @ts-ignore
import tree1 from './tree1.obj'
import { OBJ } from 'webgl-obj-loader'

export let flowerModel = flower
export let tree1Model = tree1

const loadModel = async (m: any) => {
    return await (await fetch(m)).text()
}

export const load = async () => {
    if (!loaded) {
        flowerModel = new OBJ.Mesh(await loadModel(flowerModel))
        tree1Model = new OBJ.Mesh(await loadModel(tree1Model))

        loaded = true
    }
}

export let loaded = false
