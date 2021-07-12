import {
    Euler,
    Matrix3,
    Matrix4,
    Quaternion,
    Vector3,
    Vector4,
} from '@math.gl/core'
import { MeshWithBuffers } from 'webgl-obj-loader'
import { ShaderProgram } from './ShaderProgram'

export class GameObject {
    public position: Vector3 = new Vector3([0, 0, 0])
    public orientation: Quaternion = new Quaternion().identity()
    public scale: number = 1

    public mesh?: MeshWithBuffers

    public children: GameObject[] = []

    constructor(args: { mesh?: MeshWithBuffers }) {
        this.mesh = args.mesh
    }

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
            let qX = new Quaternion()
                .fromAxisRotation(new Vector3([1, 0, 0]), args.angles.x)
                .normalize()
            let qY = new Quaternion()
                .fromAxisRotation(new Vector3([0, 1, 0]), args.angles.y)
                .normalize()
            let rot = qY.multiplyLeft(qX, undefined).normalize()
            this.orientation = this.orientation
                .multiplyRight(rot, undefined)
                .normalize()
        }
    }

    public tick(args: { deltaTime: number }) {}

    public getTransform(): Matrix4 {
        return new Matrix4()
            .scale(this.scale)
            .translate(this.position)
            .multiplyRight(new Matrix4().fromQuaternion(this.orientation))
    }

    public addChild(args: { child: GameObject }) {
        this.children.push(args.child)
    }
}
