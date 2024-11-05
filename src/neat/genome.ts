import Connection from "./connection"
import Node, { NodeTypes } from "./node"

type GenomeParams = {
  weightMutationRate: number
  nodeMutationRate: number
  connectionMutationRate: number
  canvasWidth: number
  canvasHeight: number
}

export default class Genome {
  static counter: number = 1
  id: number
  nodes: Node[]
  connections: Connection[]
  fitness: number
  weightMutationRate: number
  nodeMutationRate: number
  connectionMutationRate: number
  canvasWidth: number
  canvasHeight: number

  constructor({
    weightMutationRate,
    nodeMutationRate,
    connectionMutationRate,
    canvasWidth,
    canvasHeight,
  }: GenomeParams) {
    Genome.counter++
    this.id = Genome.counter
    this.nodes = []
    this.connections = []
    this.fitness = 0
    this.weightMutationRate = weightMutationRate
    this.nodeMutationRate = nodeMutationRate
    this.connectionMutationRate = connectionMutationRate
    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight
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
      canvasHeight: this.canvasHeight,
      canvasWidth: this.canvasWidth,
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
    let shouldUpdateCoordinates: boolean = false

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

        shouldUpdateCoordinates = true
      }
    }

    if (Math.random() < this.connectionMutationRate) {
      const from = this.nodes[Math.floor(Math.random() * this.nodes.length)]
      const to = this.nodes[Math.floor(Math.random() * this.nodes.length)]
      if (from && to && from.id !== to.id) {
        const weight = Math.random() * 2 - 1
        this.connections.push(new Connection(from, to, weight))
        shouldUpdateCoordinates = true
      }
    }

    if (shouldUpdateCoordinates) {
      this.updateCoordinates()
    }
  }

  updateCoordinates() {
    const inputLength = this.inputNodes().length
    const hiddenLength = this.hiddenNodes().length
    const outputLength = this.outputNodes().length

    const layerX = this.canvasWidth / 4
    const inputY = this.canvasHeight / (inputLength + 2)
    const outputY = this.canvasHeight / (outputLength + 2)
    const hiddenY = this.canvasHeight / (hiddenLength + 2)

    let inputIndex = 1
    let hiddenIndex = 1
    let outputIndex = 1

    this.nodes.forEach((node: Node) => {
      if (node.type === NodeTypes.INPUT) {
        node.x = layerX
        node.y = inputY * inputIndex
        inputIndex++
      } else if (node.type === NodeTypes.HIDDEN) {
        node.x = layerX * 2
        node.y = hiddenY * hiddenIndex
        hiddenIndex++
      } else {
        node.x = layerX * 3
        node.y = outputY * outputIndex
        outputIndex++
      }

      // update connections
      this.connections
        .filter((conn) => conn.fromNode.id === node.id)
        .map((conn) => {
          conn.fromNode = node
          return conn
        })
      this.connections
        .filter((conn) => conn.toNode.id === node.id)
        .map((conn) => {
          conn.toNode = node
          return conn
        })
    })
  }
}
