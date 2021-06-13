import { Matrix4, Quaternion, Vector3, Vector4 } from 'math.gl'
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
        this.orientation.rotateX(args.angles.x)
        this.orientation.rotateY(args.angles.y)
        this.orientation.rotateZ(args.angles.z)
    }

    public rotateLocal(args: { angles: Vector3 }) {
        this.rotate(args)
    }

    public addChild(args: { child: GameObject }) {
        this.children.push(args.child)
    }
}
