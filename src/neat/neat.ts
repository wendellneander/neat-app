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
}

export default class NEAT {
  populationSize: number
  population: Genome[]
  generation: number
  bestGenome: Genome | null

  constructor({
    populationSize,
    inputSize,
    outputSize,
    canvasWidth,
    canvasHeight,
    weightMutationRate,
    nodeMutationRate,
    connectionMutationRate,
  }: NeatParams) {
    this.populationSize = populationSize
    this.population = []
    this.generation = 0
    this.bestGenome = null

    const layerSpacing = canvasWidth / 4
    const inputY = canvasHeight / 3
    const outputY = (canvasHeight * 2) / 3

    for (let i = 0; i < populationSize; i++) {
      const genome = new Genome({
        weightMutationRate,
        nodeMutationRate,
        connectionMutationRate,
      })

      for (let j = 0; j < inputSize; j++) {
        genome.nodes.push(
          new Node(genome.nodes.length, NodeTypes.INPUT, layerSpacing, inputY)
        )
      }

      for (let j = 0; j < outputSize; j++) {
        genome.nodes.push(
          new Node(
            genome.nodes.length,
            NodeTypes.OUTPUT,
            3 * layerSpacing,
            outputY
          )
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

      this.population.push(genome)
    }

    this.bestGenome = this.population[0].clone()
  }

  evolve() {
    this.population.forEach((genome) => {
      genome.fitness = this.evaluateFitness(genome)
    })

    this.population.sort((a, b) => b.fitness - a.fitness)

    if (
      !this.bestGenome ||
      this.population[0].fitness > this.bestGenome.fitness
    ) {
      this.bestGenome = this.population[0].clone()
    }

    const newPopulation = []
    for (let i = 0; i < Math.floor(this.populationSize * 0.2); i++) {
      newPopulation.push(this.population[i].clone())
    }

    while (newPopulation.length < this.populationSize) {
      const parent = this.selection()
      if (parent) {
        const offspring = parent.clone()
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

    let fitness = 0
    testCases.forEach((testCase) => {
      const output = this.activate(genome, testCase.inputs)
      fitness += 1 - Math.abs(output[0] - testCase.output)
    })

    return fitness / testCases.length
  }

  activate(genome: Genome, inputs: number[]): number[] {
    genome.nodes.forEach((node) => (node.value = 0))

    for (let i = 0; i < inputs.length; i++) {
      genome.nodes[i].value = inputs[i]
    }

    const outputs = []
    genome.connections.forEach((conn) => {
      if (conn.enabled) {
        conn.toNode.value += conn.fromNode.value * conn.weight
      }
    })

    for (let i = inputs.length; i < inputs.length + 1; i++) {
      outputs.push(Math.tanh(genome.nodes[i].value))
    }

    return outputs
  }
}
