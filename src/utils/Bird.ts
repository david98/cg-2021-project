import { GameObject } from './GameObject'
import { birdModel } from '../models'
import { Vector3 } from '@math.gl/core'

export class Bird extends GameObject {
    constructor() {
        super({ mesh: birdModel })
    }

    tick(args: { deltaTime: number }) {
        super.tick(args)
        // this.translateLocal({ v: new Vector3([0, 0, args.deltaTime / 100]) })
    }
}
