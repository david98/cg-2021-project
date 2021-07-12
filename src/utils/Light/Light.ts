import { GameObject } from '../GameObject'
import { Vector4 } from '@math.gl/core'

export class Light extends GameObject {
    public intensity = 1
    public color: Vector4 = new Vector4([1, 1, 1, 1])
}
