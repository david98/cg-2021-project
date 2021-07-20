// @ts-ignore
import flower from './flower.obj'
// @ts-ignore
import tree1 from './tree1.obj'
// @ts-ignore
import tree2 from './tree2.obj'
// @ts-ignore
import tree3 from './tree3.obj'
// @ts-ignore
import tree4 from './tree4.obj'
// @ts-ignore
import rock1 from './rock1.obj'
// @ts-ignore
import rock2 from './rock2.obj'
// @ts-ignore
import rock3 from './rock3.obj'
// @ts-ignore
import rock4 from './smallrock.obj'
// @ts-ignore
import stump from './stump.obj'
// @ts-ignore
import bird from './red.obj'
import { OBJ } from 'webgl-obj-loader'

export let flowerModel = flower
export let tree1Model = tree1
export let tree2Model = tree2
export let tree3Model = tree3
export let tree4Model = tree4
export let rock1Model = rock1
export let rock2Model = rock2
export let rock3Model = rock3
export let rock4Model = rock4
export let stumpModel = stump
export let birdModel = bird

const loadModel = async (m: any) => {
    return await (await fetch(m)).text()
}

export const load = async () => {
    if (!loaded) {
        flowerModel = new OBJ.Mesh(await loadModel(flowerModel))
        tree1Model = new OBJ.Mesh(await loadModel(tree1Model))
        tree2Model = new OBJ.Mesh(await loadModel(tree2Model))
        tree3Model = new OBJ.Mesh(await loadModel(tree3Model))
        tree4Model = new OBJ.Mesh(await loadModel(tree4Model))
        rock1Model = new OBJ.Mesh(await loadModel(rock1Model))
        rock2Model = new OBJ.Mesh(await loadModel(rock2Model))
        rock3Model = new OBJ.Mesh(await loadModel(rock3Model))
        rock4Model = new OBJ.Mesh(await loadModel(rock4Model))
        stumpModel = new OBJ.Mesh(await loadModel(stumpModel))
        birdModel = new OBJ.Mesh(await loadModel(birdModel))

        loaded = true
    }
}

export let loaded = false
