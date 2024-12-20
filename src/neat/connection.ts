import Node from "./node"

export default class Connection {
  private static counter = 0
  fromNode: Node
  toNode: Node
  weight: number
  innovation: number
  enabled: boolean

  constructor(
    fromNode: Node,
    toNode: Node,
    weight: number,
    innovation: number = Connection.getInnovationNumber()
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

  clone(): Connection {
    return new Connection(
      this.fromNode,
      this.toNode,
      this.weight,
      this.innovation
    )
  }

  static getInnovationNumber(): number {
    return ++Connection.counter
  }
}
