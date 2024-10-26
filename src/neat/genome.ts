import Connection from "./connection"
import Node, { NodeTypes } from "./node"

type GenomeParams = {
  weightMutationRate: number
  nodeMutationRate: number
  connectionMutationRate: number
}

export default class Genome {
  nodes: Node[]
  connections: Connection[]
  fitness: number
  weightMutationRate: number
  nodeMutationRate: number
  connectionMutationRate: number

  constructor({
    weightMutationRate,
    nodeMutationRate,
    connectionMutationRate,
  }: GenomeParams) {
    this.nodes = []
    this.connections = []
    this.fitness = 0
    this.weightMutationRate = weightMutationRate
    this.nodeMutationRate = nodeMutationRate
    this.connectionMutationRate = connectionMutationRate
  }

  inputNodes() {
    return this.nodes.filter((n) => n.type === NodeTypes.INPUT)
  }

  hiddenNodes() {
    return this.nodes.filter((n) => n.type === NodeTypes.HIDDEN)
  }

  outputNodes() {
    return this.nodes.filter((n) => n.type === NodeTypes.OUTPUT)
  }

  clone() {
    const clonedGenome = new Genome({
      weightMutationRate: this.weightMutationRate,
      nodeMutationRate: this.nodeMutationRate,
      connectionMutationRate: this.connectionMutationRate,
    })
    clonedGenome.nodes = this.nodes.map((node) => {
      const newNode = new Node(node.id, node.type, node.x, node.y, node.value)
      return newNode
    })
    clonedGenome.connections = this.connections.map((conn) => {
      const newConn = new Connection(
        conn.fromNode,
        conn.toNode,
        conn.weight,
        conn.innovation
      )
      return newConn
    })
    clonedGenome.fitness = this.fitness
    return clonedGenome
  }

  mutate() {
    if (Math.random() < this.weightMutationRate) {
      this.connections.forEach((conn) => {
        if (Math.random() < 0.1) {
          conn.weight += (Math.random() * 2 - 1) * 0.5
        }
      })
    }

    if (Math.random() < this.nodeMutationRate) {
      if (this.connections.length > 0) {
        // disbale random connection
        const connIndex = Math.floor(Math.random() * this.connections.length)
        const conn = this.connections[connIndex]
        conn.enabled = false

        // create a new node in the middle
        const { x, y } = conn.getMiddle()
        const newNode = new Node(this.nodes.length, NodeTypes.HIDDEN, x, y)
        this.nodes.push(newNode)

        // connect the connections to node
        this.connections.push(new Connection(conn.fromNode, newNode, 1.0))
        this.connections.push(new Connection(newNode, conn.toNode, conn.weight))
        console.log(`mutate new connections: ${this.connections.length}`)
      }
    }

    if (Math.random() < this.connectionMutationRate) {
      const from = this.nodes[Math.floor(Math.random() * this.nodes.length)]
      const to = this.nodes[Math.floor(Math.random() * this.nodes.length)]
      if (from && to && from.id !== to.id) {
        this.connections.push(new Connection(from, to, Math.random() * 2 - 1))
      }
    }
  }
}
