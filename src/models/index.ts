// @ts-ignore
import flower from './flower.obj'
// @ts-ignore
import tree1 from './tree1.obj'
// @ts-ignore
import rock1 from './rock1.obj'
// @ts-ignore
import rock2 from './rock2.obj'
// @ts-ignore
import stump from './stump.obj'
// @ts-ignore
import bird from './red.obj'
import { OBJ } from 'webgl-obj-loader'

export let flowerModel = flower
export let tree1Model = tree1
export let rock1Model = rock1
export let rock2Model = rock2
export let stumpModel = stump
export let birdModel = bird

const loadModel = async (m: any) => {
    return await (await fetch(m)).text()
}

export const load = async () => {
    if (!loaded) {
        flowerModel = new OBJ.Mesh(await loadModel(flowerModel))
        tree1Model = new OBJ.Mesh(await loadModel(tree1Model))
        rock1Model = new OBJ.Mesh(await loadModel(rock1Model))
        rock2Model = new OBJ.Mesh(await loadModel(rock2Model))
        stumpModel = new OBJ.Mesh(await loadModel(stumpModel))
        birdModel = new OBJ.Mesh(await loadModel(birdModel))

        loaded = true
    }
}

export let loaded = false
