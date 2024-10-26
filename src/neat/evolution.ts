import { Chart, registerables } from "chart.js"
import Genome from "./genome"
import NEAT from "./neat"
import Node, { NodeTypes } from "./node"

export type EvolutionParams = {
  canvasWidth: number
  canvasHeight: number
  populationCanvasWidth: number
  populationCanvasHeight: number
  solutionFitness: number
  populationSize: number
}

export class Evolution {
  private networkCanvas!: HTMLCanvasElement
  private networkCtx!: CanvasRenderingContext2D
  private canvasWidth: number
  private canvasHeight: number
  private populationCanvas!: HTMLCanvasElement
  private populationCtx!: CanvasRenderingContext2D
  private populationCanvasWidth: number
  private populationCanvasHeight: number
  private paramsInputsView!: HTMLDivElement
  private statisticsView!: HTMLDivElement
  view!: string

  private neat!: NEAT
  private isEvolutionRunning: boolean
  private evolutionInterval!: number
  private fitnessChart: any
  private solutionFitness: number
  private populationSize: number
  

  constructor({ canvasWidth, canvasHeight, populationCanvasWidth, populationCanvasHeight, solutionFitness, populationSize }: EvolutionParams) {
    this.isEvolutionRunning = false
    this.solutionFitness = solutionFitness
    this.populationSize = populationSize
    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight
    this.populationCanvasWidth = populationCanvasWidth
    this.populationCanvasHeight = populationCanvasHeight
    
    this.initializeNEAT()
    this.createView()
    this.initializeChart()
  }

  initializeNEAT() {
    this.neat = new NEAT({
      populationSize: this.populationSize,
      inputSize: 2,
      outputSize: 1,
      canvasWidth: this.networkCanvas?.clientWidth || 0,
      canvasHeight: this.networkCanvas?.clientHeight || 0,
      weightMutationRate: 0.3,
      nodeMutationRate: 0.5,
      connectionMutationRate: 0.6,
    })
    this.neat.bestGenome = this.neat.population[0].clone()
  }

  initializeChart() {
    if (!this.view) {
      throw new Error('No view created. Please create a view first.')
    }
    Chart.register(...registerables);
    this.fitnessChart = new Chart(this.populationCtx, {
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
            hidden: i >= this.neat.populationSize ? true : false,
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

  createView() {
    this.createCanvasView()
    this.createPopulationCanvasView()
    this.createParamsInputsView()
    this.createStatisticsView()
    this.view = `<div>TODO: view<div>`
  }

  createCanvasView() {
    this.networkCanvas = <HTMLCanvasElement>document.createElement("canvas")
    this.networkCtx = <CanvasRenderingContext2D>this.networkCanvas.getContext("2d")
    this.networkCanvas.width = this.canvasWidth
    this.networkCanvas.height = this.canvasHeight
  }

  createPopulationCanvasView() {
    this.populationCanvas = <HTMLCanvasElement>document.createElement("canvas")
    this.populationCtx = <CanvasRenderingContext2D>this.populationCanvas.getContext("2d")
    this.populationCanvas.width = this.populationCanvasWidth
    this.populationCanvas.height = this.populationCanvasHeight
  }

  createParamsInputsView() {
    this.paramsInputsView = <HTMLDivElement>document.createElement("div")
    // TODO: createParamsInputs
  }

  createStatisticsView() {
    // TODO: createStatisticsView
    this.statisticsView = <HTMLDivElement>document.createElement("div")
  }

  updateStatsView() {
    const stats = []
    stats.push(`Generation: ${this.neat.generation}`)
    stats.push(`Best Fitness: ${this.neat.bestGenome?.fitness.toFixed(4)}`)
    stats.push(`Population Size: ${this.neat.population.length}`)
    stats.push(`Nodes: ${this.neat.bestGenome?.nodes.length}`)
    stats.push(`Connections: ${this.neat.bestGenome?.connections.length}`)
    this.statisticsView.textContent = stats.join('\n')
  }

  updateChart() {
    const avgFitness =
      this.neat.population.reduce((sum, genome) => sum + genome.fitness, 0) /
      this.neat.population.length

    this.fitnessChart.data.labels.push(this.neat.generation)
    this.fitnessChart.data.datasets[0].data.push(this.neat.bestGenome?.fitness)
    this.fitnessChart.data.datasets[1].data.push(avgFitness)

    this.neat.population.slice(0, 10).forEach((genome, index) => {
      this.fitnessChart.data.datasets[index].data.push(genome.fitness)
    })

    if (this.fitnessChart.data.labels.length > 50) {
      this.fitnessChart.data.labels.shift()
      this.fitnessChart.data.datasets.forEach((dataset: any) => dataset.data.shift())
    }

    this.fitnessChart.update()
  }

  startEvolution() {
    if (this.isEvolutionRunning) {
      return
    }

    this.initializeNEAT()
    this.isEvolutionRunning = true
    this.evolutionInterval = setInterval(() => {
      this.neat.evolve()
      this.drawNetwork(this.neat.bestGenome)
      this.updateChart()
      this.updateStatsView()

      if ((this.neat.bestGenome?.fitness || 0) >= this.solutionFitness) {
        this.pauseEvolution()
        alert("Solution found!")
      }
    }, 100)
  }

  pauseEvolution() {
    this.isEvolutionRunning = false
    clearInterval(this.evolutionInterval)
  }

  resetEvolution() {
    this.pauseEvolution()
    this.initializeNEAT()
    if (this.fitnessChart) {
      this.fitnessChart.data.labels = []
      this.fitnessChart.data.datasets.forEach((dataset: any) => (dataset.data = []))
      this.fitnessChart.update()
    }
    this.drawNetwork(this.neat.population[0])
    this.updateStatsView()
  }

  drawNetwork(genome: Genome | null) {
    if (!genome) {
      return
    }
    
    this.networkCtx.clearRect(0, 0, this.networkCanvas.width, this.networkCanvas.height)

    const layerSpacing = this.networkCanvas.width / 4
    const inputY = this.networkCanvas.height / 3
    const hiddenY = this.networkCanvas.height / 2
    const outputY = (this.networkCanvas.height * 2) / 3

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
      this.networkCtx.beginPath()
      this.networkCtx.moveTo(conn.fromNode.x, conn.fromNode.y)
      this.networkCtx.lineTo(conn.toNode.x, conn.toNode.y)
      this.networkCtx.strokeStyle = conn.enabled
        ? "rgba(33, 150, 243, 0.6)"
        : "rgba(255, 0, 0, 0.3)"
        this.networkCtx.lineWidth = Math.abs(conn.weight) * 4
        this.networkCtx.stroke()
    })

    genome.nodes.forEach((node) => {
      this.networkCtx.beginPath()
      this.networkCtx.arc(node.x, node.y, 10, 0, Math.PI * 2)
      this.networkCtx.fillStyle =
        node.type === "input"
          ? "#4CAF50"
          : node.type === "hidden"
          ? "#FFC107"
          : "#F44336"
          this.networkCtx.fill()
    })
  }
}
