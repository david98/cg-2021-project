import { GameObject } from './GameObject'
import { birdModel } from '../models'
import { Matrix3, Matrix4, Quaternion, Vector3 } from '@math.gl/core'
import { degToRad, getRandomArbitrary } from './index'

export class Bird extends GameObject {
    private direction: Vector3 = new Vector3([0, 0, -1])

    private speed: number = 1.0
    private minHeight: number = 1.0
    private maxHeight: number = 10.0
    private maxDistance: number = 100.0

    private readonly zero: Vector3 = new Vector3([0, 0, 0])

    constructor(args: { intersectionRadius?: number }) {
        super({ mesh: birdModel, intersectionRadius: args.intersectionRadius })
    }

    tick(args: { deltaTime: number }) {
        super.tick(args)
        if (Math.random() < 0.01) {
            this.direction.transform(
                new Matrix4().rotateY(degToRad(getRandomArbitrary(-90, 90)))
            )
        }
        if (this.position.distance(this.zero) > this.maxDistance) {
            this.direction = this.position
                .clone()
                .multiplyScalar(-1)
                .normalize()
        }

        if (this.position.y < this.minHeight) {
            this.direction.y = 0.5
            this.direction.normalize()
        }

        if (this.position.y > this.maxHeight) {
            this.direction.y = -0.5
            this.direction.normalize()
        }

        // TODO: handle orientation

        this.translateLocal({
            v: this.direction
                .clone()
                .multiplyScalar((args.deltaTime * this.speed) / 10),
        })
    }

    onClick() {
        super.onClick()
        alert('You win!')
    }
}
