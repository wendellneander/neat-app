import { Chart } from "chart.js"
import Genome from "./neat/genome"
import NEAT from "./neat/neat"
import Node, { NodeTypes } from "./neat/node"

const networkCanvas = document.getElementById("networkCanvas")
const networkCtx = networkCanvas?.getContext("2d")
const populationCanvas = document.getElementById("populationCanvas")
const populationCtx = populationCanvas?.getContext("2d")

let neat: NEAT
let isEvolutionRunning = false
let evolutionInterval: number
let fitnessChart: any

function initializeNEAT() {
  const populationSize = parseInt(
    document.getElementById("populationSize").value,
    10
  )
  neat = new NEAT({
    populationSize,
    inputSize: 2,
    outputSize: 1,
    canvasWidth: networkCanvas?.clientWidth || 0,
    canvasHeight: networkCanvas?.clientHeight || 0,
    weightMutationRate: 0.3,
    nodeMutationRate: 0.5,
    connectionMutationRate: 0.6,
  })
  neat.bestGenome = neat.population[0].clone()
}

function drawNetwork(genome: Genome) {
  networkCtx.clearRect(0, 0, networkCanvas.width, networkCanvas.height)

  const layerSpacing = networkCanvas.width / 4
  const inputY = networkCanvas.height / 3
  const hiddenY = networkCanvas.height / 2
  const outputY = (networkCanvas.height * 2) / 3

  genome.nodes.forEach((node) => {
    if (node.type === "input") {
      node.x = layerSpacing
      node.y = inputY + node.id * 50
    } else if (node.type === "hidden") {
      node.x = 2 * layerSpacing
      node.y = hiddenY + (node.id - 2) * 50
    } else {
      node.x = 3 * layerSpacing
      node.y = outputY
    }
  })

  genome.connections.forEach((conn) => {
    networkCtx.beginPath()
    networkCtx.moveTo(conn.fromNode.x, conn.fromNode.y)
    networkCtx.lineTo(conn.toNode.x, conn.toNode.y)
    networkCtx.strokeStyle = conn.enabled
      ? "rgba(33, 150, 243, 0.6)"
      : "rgba(255, 0, 0, 0.3)"
    networkCtx.lineWidth = Math.abs(conn.weight) * 4
    networkCtx.stroke()
  })

  genome.nodes.forEach((node) => {
    networkCtx.beginPath()
    networkCtx.arc(node.x, node.y, 10, 0, Math.PI * 2)
    networkCtx.fillStyle =
      node.type === "input"
        ? "#4CAF50"
        : node.type === "hidden"
        ? "#FFC107"
        : "#F44336"
    networkCtx.fill()
  })
}

function initializeChart() {
  fitnessChart = new Chart(populationCtx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Best Fitness",
          data: [],
          borderColor: "#4CAF50",
          tension: 0.1,
        },
        {
          label: "Average Fitness",
          data: [],
          borderColor: "#2196F3",
          tension: 0.1,
        },
        ...Array.from({ length: 10 }, (_, i) => ({
          label: `Genome ${i + 1}`,
          data: [],
          borderColor: `hsl(${i * 36}, 100%, 50%)`,
          tension: 0.1,
          hidden: i >= neat.populationSize ? true : false,
        })),
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, max: 1 },
      },
    },
  })
}

function updateChart() {
  const avgFitness =
    neat.population.reduce((sum, genome) => sum + genome.fitness, 0) /
    neat.population.length

  fitnessChart.data.labels.push(neat.generation)
  fitnessChart.data.datasets[0].data.push(neat.bestGenome.fitness)
  fitnessChart.data.datasets[1].data.push(avgFitness)

  neat.population.slice(0, 10).forEach((genome, index) => {
    fitnessChart.data.datasets[index].data.push(genome.fitness)
  })

  if (fitnessChart.data.labels.length > 50) {
    fitnessChart.data.labels.shift()
    fitnessChart.data.datasets.forEach((dataset) => dataset.data.shift())
  }

  fitnessChart.update()
}

function updateStats() {
  const statsDisplay = document.getElementById("stats-display")
  statsDisplay.textContent = `Generation: ${neat.generation}
    Best Fitness: ${neat.bestGenome.fitness.toFixed(4)}
    Population Size: ${neat.population.length}
    Nodes: ${neat.bestGenome.nodes.length}
    Connections: ${neat.bestGenome.connections.length}`
}

function startEvolution() {
  if (!isEvolutionRunning) {
    const solutionFitness = parseFloat(
      document.getElementById("solutionFitness").value
    )
    initializeNEAT()
    isEvolutionRunning = true
    evolutionInterval = setInterval(() => {
      neat.evolve()
      drawNetwork(neat.bestGenome)
      updateChart()
      updateStats()

      if (neat.bestGenome.fitness >= solutionFitness) {
        pauseEvolution()
        alert("Solution found!")
      }
    }, 100)
  }
}

function pauseEvolution() {
  isEvolutionRunning = false
  clearInterval(evolutionInterval)
}

function resetEvolution() {
  pauseEvolution()
  initializeNEAT()
  if (fitnessChart) {
    fitnessChart.data.labels = []
    fitnessChart.data.datasets.forEach((dataset) => (dataset.data = []))
    fitnessChart.update()
  }
  drawNetwork(neat.population[0])
  updateStats()
}

// Redefinir a largura e altura do canvas
networkCanvas.width = networkCanvas.clientWidth
networkCanvas.height = networkCanvas.clientHeight
populationCanvas.width = populationCanvas.clientWidth
populationCanvas.height = populationCanvas.clientHeight

initializeNEAT()
initializeChart()
drawNetwork(neat.population[0])
updateStats()

type EvolutionParams = {
  canvasWidth: number
  canvasHeight: number
}

export class Evolution {
  canvas!: HTMLCanvasElement
  ctx: any
  neat!: NEAT
  statisticsView!: HTMLDivElement

  constructor({ canvasWidth, canvasHeight }: EvolutionParams) {
    this.createCanvas(canvasWidth, canvasHeight)
    this.createParamsInputs()
    this.createStatisticsView()
    this.initializeNEAT()
    this.initializeChart()
    this.drawNetwork(this.neat.population[0])
    this.updateStats()
  }

  createCanvas(width: number, height: number) {
    this.canvas = <HTMLCanvasElement>document.createElement("canvas")
    this.ctx = this.canvas.getContext("2d")
    this.canvas.width = width
    this.canvas.height = height
    document.body.appendChild(this.canvas)
  }

  createParamsInputs() {}

  createStatisticsView() {
    this.statisticsView = <HTMLDivElement>document.createElement("div")
  }

  initializeNEAT() {
    const populationSize = parseInt(
      document.getElementById("populationSize").value,
      10
    )
    this.neat = new NEAT({
      populationSize,
      inputSize: 2,
      outputSize: 1,
      canvasWidth: networkCanvas?.clientWidth || 0,
      canvasHeight: networkCanvas?.clientHeight || 0,
      weightMutationRate: 0.3,
      nodeMutationRate: 0.5,
      connectionMutationRate: 0.6,
    })
    this.neat.bestGenome = neat.population[0].clone()
  }

  initializeChart() {
    fitnessChart = new Chart(populationCtx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Best Fitness",
            data: [],
            borderColor: "#4CAF50",
            tension: 0.1,
          },
          {
            label: "Average Fitness",
            data: [],
            borderColor: "#2196F3",
            tension: 0.1,
          },
          ...Array.from({ length: 10 }, (_, i) => ({
            label: `Genome ${i + 1}`,
            data: [],
            borderColor: `hsl(${i * 36}, 100%, 50%)`,
            tension: 0.1,
            hidden: i >= neat.populationSize ? true : false,
          })),
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true, max: 1 },
        },
      },
    })
  }

  drawNetwork(genome: Genome) {
    networkCtx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    const layerSpacing = this.canvas.width / 4
    const inputY = this.canvas.height / 3
    const hiddenY = this.canvas.height / 2
    const outputY = (this.canvas.height * 2) / 3

    genome.nodes.forEach((node: Node) => {
      if (node.type === NodeTypes.INPUT) {
        node.x = layerSpacing
        node.y = inputY + node.id * 50
      } else if (node.type === NodeTypes.HIDDEN) {
        node.x = 2 * layerSpacing
        node.y = hiddenY + (node.id - 2) * 50
      } else {
        node.x = 3 * layerSpacing
        node.y = outputY
      }
    })

    genome.connections.forEach((conn) => {
      networkCtx.beginPath()
      networkCtx.moveTo(conn.fromNode.x, conn.fromNode.y)
      networkCtx.lineTo(conn.toNode.x, conn.toNode.y)
      networkCtx.strokeStyle = conn.enabled
        ? "rgba(33, 150, 243, 0.6)"
        : "rgba(255, 0, 0, 0.3)"
      networkCtx.lineWidth = Math.abs(conn.weight) * 4
      networkCtx.stroke()
    })

    genome.nodes.forEach((node) => {
      networkCtx.beginPath()
      networkCtx.arc(node.x, node.y, 10, 0, Math.PI * 2)
      networkCtx.fillStyle =
        node.type === "input"
          ? "#4CAF50"
          : node.type === "hidden"
          ? "#FFC107"
          : "#F44336"
      networkCtx.fill()
    })
  }

  updateStats() {
    const stats = []
    stats.push(`Generation: ${neat.generation}`)
    stats.push(`Best Fitness: ${neat.generation}`)
    stats.push(`Generation: ${neat.generation}`)
    this.statisticsView.textContent = `Generation: ${neat.generation}
      Best Fitness: ${this.neat.bestGenome?.fitness.toFixed(4)}
      Population Size: ${this.neat.population.length}
      Nodes: ${this.neat.bestGenome?.nodes.length}
      Connections: ${this.neat.bestGenome?.connections.length}`
  }

  updateChart() {
    const avgFitness =
      neat.population.reduce((sum, genome) => sum + genome.fitness, 0) /
      neat.population.length

    fitnessChart.data.labels.push(neat.generation)
    fitnessChart.data.datasets[0].data.push(neat.bestGenome.fitness)
    fitnessChart.data.datasets[1].data.push(avgFitness)

    neat.population.slice(0, 10).forEach((genome, index) => {
      fitnessChart.data.datasets[index].data.push(genome.fitness)
    })

    if (fitnessChart.data.labels.length > 50) {
      fitnessChart.data.labels.shift()
      fitnessChart.data.datasets.forEach((dataset) => dataset.data.shift())
    }

    fitnessChart.update()
  }

  startEvolution() {
    if (!isEvolutionRunning) {
      const solutionFitness = parseFloat(
        document.getElementById("solutionFitness").value
      )
      initializeNEAT()
      isEvolutionRunning = true
      evolutionInterval = setInterval(() => {
        neat.evolve()
        drawNetwork(neat.bestGenome)
        updateChart()
        updateStats()

        if (neat.bestGenome.fitness >= solutionFitness) {
          pauseEvolution()
          alert("Solution found!")
        }
      }, 100)
    }
  }

  pauseEvolution() {
    isEvolutionRunning = false
    clearInterval(evolutionInterval)
  }

  resetEvolution() {
    this.pauseEvolution()
    this.initializeNEAT()
    if (fitnessChart) {
      fitnessChart.data.labels = []
      fitnessChart.data.datasets.forEach((dataset) => (dataset.data = []))
      fitnessChart.update()
    }
    this.drawNetwork(neat.population[0])
    this.updateStats()
  }
}
