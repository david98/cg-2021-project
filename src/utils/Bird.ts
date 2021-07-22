import { GameObject } from './GameObject'
import { birdModel } from '../models'
import { Matrix3, Matrix4, Quaternion, Vector3 } from '@math.gl/core'
import { degToRad, getRandomArbitrary } from './index'

export class Bird extends GameObject {
    private speed: number = 1.5
    private minHeight: number = 1.0
    private maxHeight: number = 10.0
    private maxDistance: number = 5.0

    public spawn: Vector3 = new Vector3([0, 0, 0])

    private readonly zero: Vector3 = new Vector3([0, 0, 0])

    private goingBack: boolean = false

    constructor(args: { intersectionRadius?: number }) {
        super({ mesh: birdModel, intersectionRadius: args.intersectionRadius })
    }

    tick(args: { deltaTime: number }) {
        super.tick(args)
        let rot = degToRad(getRandomArbitrary(-90, 90))
        if (Math.random() < 0.005 && !this.goingBack) {
            this.rotate({ angles: new Vector3([0, rot, 0]) })
        }

        // TODO: handle orientation

        this.translateLocal({
            v: new Vector3([0, 0, 1]).multiplyScalar(
                (args.deltaTime * this.speed) / 10
            ),
        })
    }

    onClick() {
        super.onClick()
        alert('You win!')
    }
}
