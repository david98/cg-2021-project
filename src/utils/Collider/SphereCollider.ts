import { Collider } from './Collider'
import { Vector3 } from '@math.gl/core'
import { GameObject } from '../GameObject'

export class SphereCollider extends Collider {
    // position relative to the game object it's attached to
    public relativeCenter: Vector3
    public radius: number

    constructor(args: {
        gameObject: GameObject
        relativeCenter?: Vector3
        radius?: number
    }) {
        super({ gameObject: args.gameObject })
        if (args.gameObject.mesh) {
            // build optimal bounding sphere with Ritter's algorithm
            const zero = new Vector3([0, 0, 0])
            let minimumX = zero
            let minimumY = zero
            let minimumZ = zero

            let maximumX = zero
            let maximumY = zero
            let maximumZ = zero

            for (let i = 0; i < args.gameObject.mesh.vertices.length; i += 3) {
                let vertex = new Vector3([
                    args.gameObject.mesh.vertices[i],
                    args.gameObject.mesh.vertices[i + 1],
                    args.gameObject.mesh.vertices[i + 2],
                ])

                if (vertex.x < minimumX.x) {
                    minimumX = vertex.clone()
                }
                if (vertex.x > maximumX.x) {
                    maximumX = vertex.clone()
                }

                if (vertex.y < minimumY.y) {
                    minimumY = vertex.clone()
                }
                if (vertex.y > maximumY.y) {
                    maximumY = vertex.clone()
                }

                if (vertex.z < minimumZ.z) {
                    minimumZ = vertex.clone()
                }
                if (vertex.z > maximumZ.z) {
                    maximumZ = vertex.clone()
                }
            }
            let distanceX = maximumX.x - minimumX.x
            let distanceY = maximumY.y - minimumY.y
            let distanceZ = maximumZ.z - minimumZ.z

            let maxDistance = Math.max(
                distanceX,
                Math.max(distanceY, distanceZ)
            )

            let center: Vector3
            let radius: number

            if (maxDistance === distanceX) {
                center = this.midpoint({ point1: minimumX, point2: maximumX })
                radius = maximumX.distance(minimumX) / 2
            } else if (maxDistance === distanceY) {
                center = this.midpoint({ point1: minimumY, point2: maximumY })
                radius = maximumY.distance(minimumY) / 2
            } else {
                center = this.midpoint({ point1: minimumZ, point2: maximumZ })
                radius = maximumZ.distance(minimumZ) / 2
            }

            console.log(center)
            console.log(radius)
            for (let i = 0; i < args.gameObject.mesh.vertices.length; i += 3) {
                let vertex = new Vector3([
                    args.gameObject.mesh.vertices[i],
                    args.gameObject.mesh.vertices[i + 1],
                    args.gameObject.mesh.vertices[i + 2],
                ])

                let d = vertex.distance(center)
                if (d > radius) {
                    let dir = vertex.clone().normalize()
                    center.add(dir.multiplyScalar((d - radius) / 2))
                    radius = (d + radius) / 2
                }
            }
            this.relativeCenter = center
            this.radius = radius

            console.log(this.relativeCenter)
            console.log(this.radius)
        } else if (args.relativeCenter && args.radius) {
            this.relativeCenter = args.relativeCenter
            this.radius = args.radius
        } else {
            throw new Error('Invalid parameters')
        }
    }

    raycast(args: { rayOrigin: Vector3; rayDirection: Vector3 }): boolean {
        let center = this.relativeCenter
            .clone()
            .transformAsPoint(this.gameObject.getTransform())

        let l = center.clone().sub(args.rayOrigin)
        let lSquared = l.dot(l)

        if (lSquared < this.radius * this.radius) {
            // ray origin is inside the sphere
            return true
        }

        let s = l.dot(args.rayDirection)
        if (s < 0) {
            // sphere center is behind ray origin
            return false
        }

        let mSquared = lSquared - s * s

        if (mSquared > this.radius * this.radius) {
            // ray will miss the sphere
            return false
        }

        return true
    }

    private midpoint(args: { point1: Vector3; point2: Vector3 }): Vector3 {
        return new Vector3([
            (args.point1.x + args.point2.x) / 2,
            (args.point1.y + args.point2.y) / 2,
            (args.point1.z + args.point2.z) / 2,
        ])
    }
}
