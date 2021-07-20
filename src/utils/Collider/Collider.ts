import { Vector3 } from '@math.gl/core'
import { GameObject } from '../GameObject'

export class Collider {
    public gameObject: GameObject

    constructor(args: { gameObject: GameObject }) {
        this.gameObject = args.gameObject
    }
    // returns true if the ray intersects with the collider
    public raycast(args: {
        rayOrigin: Vector3
        rayDirection: Vector3
    }): boolean {
        return false
    }
}
