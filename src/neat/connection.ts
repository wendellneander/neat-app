import Node from "./node"

export default class Connection {
  fromNode: Node
  toNode: Node
  weight: number
  innovation: number
  enabled: boolean

  constructor(
    fromNode: Node,
    toNode: Node,
    weight: number,
    innovation: number = 0
  ) {
    this.fromNode = fromNode
    this.toNode = toNode
    this.weight = weight
    this.innovation = innovation
    this.enabled = true
  }

  getMiddle() {
    // TODO
    const x = this.toNode.x - this.fromNode.x
    const y = this.toNode.y - this.fromNode.y
    return { x, y }
  }
}
