import { GameObject } from './GameObject'
import { Euler, Vector3 } from '@math.gl/core'
import { degToRad } from './index'

export class Camera extends GameObject {
    private roll: number = 0
    private yaw: number = 0
    private pitch: number = 0

    rotate(args: { angles: Vector3; bounds?: Vector3 }) {
        this.roll = (this.roll + args.angles.z) % (2 * Math.PI)
        this.yaw = (this.yaw + args.angles.y) % (2 * Math.PI)
        this.pitch = (this.pitch + args.angles.x) % (2 * Math.PI)

        if (args.bounds) {
            if (this.yaw > Math.abs(args.bounds.x)) {
                this.yaw = Math.abs(args.bounds.x)
            }
            if (this.yaw < -Math.abs(args.bounds.x)) {
                this.yaw = -Math.abs(args.bounds.x)
            }
        }

        // TODO: fix this
        let temp = new Euler().fromVector3(
            new Vector3([this.yaw, this.pitch, this.roll]),
            Euler.YXZ
        )

        this.orientation = temp.toQuaternion().normalize()
    }
}

export default Camera
