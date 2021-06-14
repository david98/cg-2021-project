import {
    Euler,
    Matrix3,
    Matrix4,
    Quaternion,
    Vector3,
    Vector4,
} from '@math.gl/core'
import { Mesh, MeshWithBuffers } from 'webgl-obj-loader'

export class GameObject {
    public position: Vector3 = new Vector3([0, 0, 0])
    public orientation: Quaternion = new Quaternion().identity()
    public scale: number = 1

    public mesh?: MeshWithBuffers

    public children: GameObject[] = []

    constructor(args: {}) {}

    public translateLocal(args: { v: Vector3 }) {
        this.position.add(
            args.v.transform(new Matrix4().fromQuaternion(this.orientation))
        )
    }

    public translate(args: { v: Vector3 }) {
        this.position.add(args.v)
    }

    public rotate(args: { angles: Vector3 }) {
        if (args.angles) {
            let qX = new Quaternion().setFromAxisAngle(
                new Vector3([1, 0, 0]),
                args.angles.x
            )
            let qY = new Quaternion().setFromAxisAngle(
                new Vector3([0, 1, 0]),
                args.angles.y
            )
            let rot = qY.multiplyLeft(qX, undefined)
            this.orientation = this.orientation
                .multiplyRight(rot, undefined)
                .normalize()
        }
    }

    public addChild(args: { child: GameObject }) {
        this.children.push(args.child)
    }
}
