import { Euler, Matrix4, Quaternion, Vector3 } from '@math.gl/core'
import { MeshWithBuffers } from 'webgl-obj-loader'

export class GameObject {
    public position: Vector3 = new Vector3([0, 0, 0])
    public orientation: Quaternion = new Quaternion().identity()
    public scale: number = 1
    public intersectionRadius: number = 0

    public mesh?: MeshWithBuffers

    public children: GameObject[] = []

    public textureSlot: number = 0

    constructor(args: { mesh?: MeshWithBuffers; intersectionRadius?: number }) {
        this.mesh = args.mesh
        this.intersectionRadius = args.intersectionRadius || 0
    }

    public translateLocal(args: { v: Vector3 }) {
        this.position.add(
            args.v.transform(new Matrix4().fromQuaternion(this.orientation))
        )
    }

    public translate(args: { v: Vector3 }) {
        this.position.add(args.v)
    }

    public rotate(args: { angles?: Vector3; quaternion?: Quaternion }) {
        if (args.angles) {
            let euler = new Euler().fromVector3(args.angles, Euler.XYZ)
            this.orientation = this.orientation
                .multiplyRight(euler.toQuaternion(), undefined)
                .normalize()
        }

        if (args.quaternion) {
            this.orientation = this.orientation.multiplyRight(
                args.quaternion,
                undefined
            )
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
