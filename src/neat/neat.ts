import Connection from "./connection"
import Genome from "./genome"
import Node, { NodeTypes } from "./node"

type NeatParams = {
  populationSize: number
  inputSize: number
  outputSize: number
  canvasWidth: number
  canvasHeight: number
  weightMutationRate: number
  nodeMutationRate: number
  connectionMutationRate: number
  crossoverRate: number
}

export default class NEAT {
  populationSize: number
  population: Genome[]
  generation: number
  bestGenome: Genome | null
  crossoverRate: number

  constructor({
    populationSize,
    inputSize,
    outputSize,
    canvasWidth,
    canvasHeight,
    weightMutationRate,
    nodeMutationRate,
    connectionMutationRate,
    crossoverRate,
  }: NeatParams) {
    this.populationSize = populationSize
    this.population = []
    this.generation = 0
    this.bestGenome = null
    this.crossoverRate = crossoverRate

    const layerX = canvasWidth / 4
    const inputY = canvasHeight / 3
    const outputY = (canvasHeight * 2) / 3

    for (let i = 0; i < populationSize; i++) {
      const genome = new Genome({
        weightMutationRate,
        nodeMutationRate,
        connectionMutationRate,
        canvasWidth,
        canvasHeight,
      })

      for (let j = 0; j < inputSize; j++) {
        genome.nodes.push(
          new Node(genome.nodes.length, NodeTypes.INPUT, layerX, inputY)
        )
      }

      for (let j = 0; j < outputSize; j++) {
        genome.nodes.push(
          new Node(genome.nodes.length, NodeTypes.OUTPUT, 2 * layerX, outputY)
        )
      }

      for (let j = 0; j < inputSize; j++) {
        for (let k = 0; k < outputSize; k++) {
          genome.connections.push(
            new Connection(
              genome.nodes[j],
              genome.nodes[inputSize + k],
              Math.random() * 2 - 1
            )
          )
        }
      }
      genome.updateCoordinates()
      this.population.push(genome)
    }

    this.bestGenome = this.population[0].clone()
  }

  evolve() {
    // Evaluate and sort population
    this.population.forEach((genome) => {
      genome.fitness = this.evaluateFitness(genome)
    })
    this.population.sort((a, b) => b.fitness - a.fitness)

    // Update best genome if necessary
    if (!this.bestGenome || this.population[0].fitness > this.bestGenome.fitness) {
      this.bestGenome = this.population[0].clone()
    }

    const newPopulation = []
    
    // Keep the top 20% performers
    for (let i = 0; i < Math.floor(this.populationSize * 0.2); i++) {
      newPopulation.push(this.population[i].clone())
    }

    // Fill the rest with crossover and mutation
    while (newPopulation.length < this.populationSize) {
      const parent1 = this.selection()
      const parent2 = this.selection()
      
      if (parent1 && parent2) {
        const offspring = this.crossover(parent1, parent2)
        offspring.mutate()
        newPopulation.push(offspring)
      }
    }

    this.population = newPopulation
    this.generation++
  }

  selection(): Genome | null {
    const tournamentSize = 3
    let best = null

    for (let i = 0; i < tournamentSize; i++) {
      const randomIndex = Math.floor(Math.random() * this.population.length)
      const contestant = this.population[randomIndex]
      if (!best || contestant.fitness > best.fitness) {
        best = contestant
      }
    }

    return best
  }

  evaluateFitness(genome: Genome): number {
    const testCases = [
      { inputs: [0, 0], output: 0 },
      { inputs: [0, 1], output: 1 },
      { inputs: [1, 0], output: 1 },
      { inputs: [1, 1], output: 0 },
    ]

    let totalError = 0
    testCases.forEach((testCase) => {
      const output = this.activate(genome, testCase.inputs)[0]
      const error = Math.abs(output - testCase.output)
      totalError += error * error // Using squared error
    })

    const fitness = 1 / (1 + totalError) // Convert error to fitness (0 to 1)
    return fitness
  }

  activate(genome: Genome, inputs: number[]): number[] {
    // Reset all node values and inputs
    genome.nodes.forEach((node) => {
      node.value = 0
      if (node.type === NodeTypes.INPUT) {
        const inputIndex = genome.inputNodes().findIndex(n => n.id === node.id)
        if (inputIndex !== -1 && inputIndex < inputs.length) {
          node.value = inputs[inputIndex]
        }
      }
    })

    // Sort nodes topologically by x position
    const sortedNodes = [...genome.nodes].sort((a, b) => a.x - b.x)

    // Process each node in order
    sortedNodes.forEach((node) => {
      if (node.type !== NodeTypes.INPUT) {
        // Get all incoming connections to this node
        const incomingConnections = genome.connections.filter(
          conn => conn.enabled && conn.toNode.id === node.id
        )

        // Sum up all inputs through incoming connections
        let sum = 0
        incomingConnections.forEach(conn => {
          sum += conn.fromNode.value * conn.weight
        })

        // Apply activation function
        node.value = this.sigmoid(sum)
      }
    })

    // Get output values
    return genome.outputNodes().map(node => node.value)
  }

  // Add this new sigmoid function
  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-4.9 * x))
  }

  crossover(parent1: Genome, parent2: Genome): Genome {
    // Create a new offspring genome with the same parameters as parents
    const offspring = new Genome({
      weightMutationRate: parent1.weightMutationRate,
      nodeMutationRate: parent1.nodeMutationRate,
      connectionMutationRate: parent1.connectionMutationRate,
      canvasWidth: parent1.canvasWidth,
      canvasHeight: parent1.canvasHeight,
    })

    // Copy all nodes from the fitter parent
    const fitParent = parent1.fitness > parent2.fitness ? parent1 : parent2
    offspring.nodes = fitParent.nodes.map((node) => node.clone())

    // Create maps of connections for easy lookup
    const p1Connections = new Map(
      parent1.connections.map((conn) => [
        `${conn.fromNode.id}-${conn.toNode.id}`,
        conn,
      ])
    )
    const p2Connections = new Map(
      parent2.connections.map((conn) => [
        `${conn.fromNode.id}-${conn.toNode.id}`,
        conn,
      ])
    )

    // Iterate through all connections in both parents
    const allConnectionKeys = new Set([
      ...p1Connections.keys(),
      ...p2Connections.keys(),
    ])

    allConnectionKeys.forEach((key) => {
      const conn1 = p1Connections.get(key)
      const conn2 = p2Connections.get(key)

      if (conn1 && conn2) {
        // If both parents have the connection, randomly choose one
        const selectedConn = Math.random() < this.crossoverRate ? conn1 : conn2
        const newConn = selectedConn.clone()
        newConn.fromNode = offspring.nodes[selectedConn.fromNode.id]
        newConn.toNode = offspring.nodes[selectedConn.toNode.id]
        offspring.connections.push(newConn)
      } else {
        // If only one parent has the connection, inherit from the fitter parent
        const conn = conn1 || conn2
        if (
          conn &&
          ((parent1.fitness > parent2.fitness && conn1) ||
            (parent2.fitness >= parent1.fitness && conn2))
        ) {
          const newConn = conn.clone()
          newConn.fromNode = offspring.nodes[conn.fromNode.id]
          newConn.toNode = offspring.nodes[conn.toNode.id]
          offspring.connections.push(newConn)
        }
      }
    })

    offspring.updateCoordinates()
    return offspring
  }
}
