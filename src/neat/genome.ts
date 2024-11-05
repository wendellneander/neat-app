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

    // Weight mutation
    if (Math.random() < this.weightMutationRate) {
      this.connections.forEach((conn) => {
        if (Math.random() < 0.1) {
          // Perturbação pequena ou reinicialização completa
          if (Math.random() < 0.7) {
            conn.weight += (Math.random() * 2 - 1) * 0.5
          } else {
            conn.weight = Math.random() * 4 - 2 // Pesos entre -2 e 2
          }
        }
      })
    }

    // Node mutation
    if (Math.random() < this.nodeMutationRate) {
      if (this.connections.length > 0) {
        // Seleciona conexões habilitadas apenas
        const enabledConnections = this.connections.filter(
          (conn) => conn.enabled
        )
        if (enabledConnections.length > 0) {
          const connIndex = Math.floor(
            Math.random() * enabledConnections.length
          )
          const conn = enabledConnections[connIndex]
          conn.enabled = false

          const { x, y } = conn.getMiddle()
          const newNode = new Node(this.nodes.length, NodeTypes.HIDDEN, x, y)
          this.nodes.push(newNode)

          // Cria novas conexões com pesos otimizados
          this.connections.push(new Connection(conn.fromNode, newNode, 1.0))
          this.connections.push(
            new Connection(newNode, conn.toNode, conn.weight)
          )

          shouldUpdateCoordinates = true
        }
      }
    }

    // Connection mutation
    if (Math.random() < this.connectionMutationRate) {
      // Tenta várias vezes encontrar uma conexão válida
      for (let attempts = 0; attempts < 5; attempts++) {
        const fromNode =
          this.nodes[Math.floor(Math.random() * this.nodes.length)]
        const toNode = this.nodes[Math.floor(Math.random() * this.nodes.length)]

        // Verifica se a conexão é válida
        if (
          fromNode &&
          toNode &&
          fromNode.id !== toNode.id &&
          fromNode.x < toNode.x &&
          !this.connections.some(
            (c) => c.fromNode.id === fromNode.id && c.toNode.id === toNode.id
          )
        ) {
          const weight = Math.random() * 4 - 2 // Pesos entre -2 e 2
          this.connections.push(new Connection(fromNode, toNode, weight))
          shouldUpdateCoordinates = true
          break
        }
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
