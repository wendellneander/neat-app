import { Chart, registerables } from "chart.js"
import Genome from "./genome"
import NEAT from "./neat"
import Node, { NodeTypes } from "./node"

export type EvolutionParams = {
  canvasWidth: number
  canvasHeight: number
  populationCanvasWidth: number
  populationCanvasHeight: number
  targetFitness: number
  populationSize: number
  weightMutationRate: number
  nodeMutationRate: number
  connectionMutationRate: number
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
  private statisticsDisplay!: HTMLDivElement
  view!: HTMLElement

  private neat!: NEAT
  private isEvolutionRunning: boolean
  private evolutionInterval!: number
  private fitnessChart: any
  private targetFitness: number
  private populationSize: number
  private weightMutationRate: number
  private nodeMutationRate: number
  private connectionMutationRate: number

  constructor({ canvasWidth, canvasHeight, populationCanvasWidth, populationCanvasHeight, targetFitness, populationSize, weightMutationRate, nodeMutationRate }: EvolutionParams) {
    this.isEvolutionRunning = false
    this.targetFitness = targetFitness
    this.populationSize = populationSize
    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight
    this.populationCanvasWidth = populationCanvasWidth
    this.populationCanvasHeight = populationCanvasHeight

    this.weightMutationRate = weightMutationRate
    this.nodeMutationRate = nodeMutationRate
    this.connectionMutationRate = populationCanvasHeight
    
    this.createView()
    this.initializeNEAT()
    this.initializeChart()
  }

  initializeNEAT() {
    this.neat = new NEAT({
      populationSize: this.populationSize,
      inputSize: 2,
      outputSize: 1,
      canvasWidth: this.networkCanvas?.clientWidth || 0,
      canvasHeight: this.networkCanvas?.clientHeight || 0,
      weightMutationRate: this.weightMutationRate,
      nodeMutationRate: this.nodeMutationRate,
      connectionMutationRate: this.connectionMutationRate,
    })
    this.neat.bestGenome = this.neat.population[0].clone()
  }

  initializeChart() {
    if (!this.view) {
      throw new Error('No view created. Please create a view first.')
    }
    Chart.register(...registerables)
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
    const networkVisualization = this.createNetworkView()
    const populationVisualization = this.createPopulationView()
    const statisticsVisualization = this.createStatisticsView()
    const paramsInputVisualization = this.createParamsInputView()

    const containerDiv = document.createElement('div')
    containerDiv.className = 'container'

    containerDiv.appendChild(networkVisualization)
    containerDiv.appendChild(populationVisualization)
    containerDiv.appendChild(statisticsVisualization)
    containerDiv.appendChild(paramsInputVisualization)

    this.view = containerDiv
  }

  createNetworkView(): HTMLElement {
    // Cria o div principal
    const visualizationDiv = document.createElement('div')
    visualizationDiv.className = 'visualization'

    // Cria o título
    const title = document.createElement('h2')
    title.textContent = 'Network Visualization'
    visualizationDiv.appendChild(title)

    // Cria o canvas
    this.networkCanvas = <HTMLCanvasElement>document.createElement("canvas")
    this.networkCtx = <CanvasRenderingContext2D>this.networkCanvas.getContext("2d")
    this.networkCanvas.width = this.canvasWidth
    this.networkCanvas.height = this.canvasHeight
    this.networkCanvas.id = 'networkCanvas'
    visualizationDiv.appendChild(this.networkCanvas)

    // Cria o div de controles
    const controlsDiv = document.createElement('div')
    controlsDiv.className = 'controls'

    // Botão Start Evolution
    const startButton = document.createElement('button')
    startButton.textContent = 'Start Evolution'
    startButton.onclick = () => this.startEvolution()

    controlsDiv.appendChild(startButton)

    // Botão Pause
    const pauseButton = document.createElement('button')
    pauseButton.textContent = 'Pause'
    pauseButton.onclick = () => this.pauseEvolution()
    controlsDiv.appendChild(pauseButton)

    // Botão Reset
    const resetButton = document.createElement('button')
    resetButton.textContent = 'Reset'
    resetButton.onclick = () => this.resetEvolution()
    controlsDiv.appendChild(resetButton)

    // Adiciona o div de controles ao div principal
    visualizationDiv.appendChild(controlsDiv)
    return visualizationDiv
  }

  createPopulationView() {
    // Cria o div principal para a visualização
    const visualizationDiv = document.createElement('div')
    visualizationDiv.className = 'visualization'
  
    // Cria o título "Population Fitness"
    const title = document.createElement('h2')
    title.textContent = 'Population Fitness'
    visualizationDiv.appendChild(title)
  
    // Cria o elemento canvas com id "populationCanvas"
    this.populationCanvas = <HTMLCanvasElement>document.createElement("canvas")
    this.populationCtx = <CanvasRenderingContext2D>this.populationCanvas.getContext("2d")
    this.populationCanvas.width = this.populationCanvasWidth
    this.populationCanvas.height = this.populationCanvasHeight
    this.networkCanvas.id = 'populationCanvas'
    visualizationDiv.appendChild(this.populationCanvas)
    return visualizationDiv
  }

  createParamsInputView(): HTMLElement {
    // Div principal para visualização
    const visualizationDiv = document.createElement('div')
    visualizationDiv.className = 'visualization'

    // Div para os controles de parâmetros
    const parameterControlsDiv = document.createElement('div')
    parameterControlsDiv.className = 'parameter-controls'

    // Título dos parâmetros
    const parameterTitle = document.createElement('h3')
    parameterTitle.textContent = 'Simulation Parameters'
    parameterControlsDiv.appendChild(parameterTitle)

    // Controle para Population Size
    const populationLabel = document.createElement('label')
    populationLabel.textContent = 'Population Size: '
    const populationInput = document.createElement('input')
    populationInput.id = 'populationSize'
    populationInput.type = 'number'
    populationInput.min = '10'
    populationInput.max = '200'
    populationInput.value = '50'
    populationInput.onchange = (e: any) => {
      const parsed = parseInt(e.target?.value)
      this.populationSize = parsed
      console.log('new population size:', parsed)
    }
    populationLabel.appendChild(populationInput)
    parameterControlsDiv.appendChild(populationLabel)

    // Controle para Target Solution Fitness
    const fitnessLabel = document.createElement('label')
    fitnessLabel.textContent = 'Target Solution Fitness: '
    const fitnessInput = document.createElement('input')
    fitnessInput.id = 'targetFitness'
    fitnessInput.type = 'number'
    fitnessInput.step = '0.01'
    fitnessInput.min = '0'
    fitnessInput.max = '1'
    fitnessInput.value = '0.95'
    fitnessInput.onchange = (e: any) => {
      const parsed = parseFloat(e.target?.value)
      this.targetFitness = parsed
      console.log('new target fitness value:', parsed)
    }
    fitnessLabel.appendChild(fitnessInput)
    parameterControlsDiv.appendChild(fitnessLabel)

    // Adiciona o div de controles de parâmetros ao div principal
    visualizationDiv.appendChild(parameterControlsDiv)

    // Div para os controles de mutação
    const mutationControlsDiv = document.createElement('div')
    mutationControlsDiv.className = 'mutation-controls'

    // Título dos controles de mutação
    const mutationTitle = document.createElement('h3')
    mutationTitle.textContent = 'Mutation Rates'
    mutationControlsDiv.appendChild(mutationTitle)

    // Controle para Weight Mutation Rate
    const weightLabel = document.createElement('label')
    weightLabel.textContent = 'Weight Mutation Rate: '
    const weightInput = document.createElement('input')
    weightInput.id = 'weightMutationRate'
    weightInput.type = 'number'
    weightInput.step = '0.01'
    weightInput.min = '0'
    weightInput.max = '1'
    weightInput.value = '0.8'
    weightInput.onchange = (e: any) => {
      const parsed = parseFloat(e.target?.value)
      this.weightMutationRate = parsed
      console.log('new weight mutation rate:', parsed)
    }
    weightLabel.appendChild(weightInput)
    mutationControlsDiv.appendChild(weightLabel)

    // Controle para Node Mutation Rate
    const nodeLabel = document.createElement('label')
    nodeLabel.textContent = 'Node Mutation Rate: '
    const nodeInput = document.createElement('input')
    nodeInput.id = 'nodeMutationRate'
    nodeInput.type = 'number'
    nodeInput.step = '0.01'
    nodeInput.min = '0'
    nodeInput.max = '1'
    nodeInput.value = '0.3'
    nodeInput.onchange = (e: any) => {
      const parsed = parseFloat(e.target?.value)
      this.nodeMutationRate = parsed
      console.log('new node mutation rate:', parsed)
    }
    nodeLabel.appendChild(nodeInput)
    mutationControlsDiv.appendChild(nodeLabel)

    // Controle para Connection Mutation Rate
    const connectionLabel = document.createElement('label')
    connectionLabel.textContent = 'Connection Mutation Rate: '
    const connectionInput = document.createElement('input')
    connectionInput.id = 'connectionMutationRate'
    connectionInput.type = 'number'
    connectionInput.step = '0.01'
    connectionInput.min = '0'
    connectionInput.max = '1'
    connectionInput.value = '0.6'
    connectionInput.onchange = (e: any) => {
      const parsed = parseFloat(e.target?.value)
      this.connectionMutationRate = parsed
      console.log('new connection mutation rate:', parsed)
    }
    connectionLabel.appendChild(connectionInput)
    mutationControlsDiv.appendChild(connectionLabel)

    // Adiciona o div de controles de mutação ao div principal
    visualizationDiv.appendChild(mutationControlsDiv)
    return visualizationDiv
  }

  createStatisticsView(): HTMLElement {
    // Cria o div principal para as estatísticas
    const statsDiv = document.createElement('div')
    statsDiv.className = 'stats'

    // Cria o título "Statistics"
    const title = document.createElement('h2')
    title.textContent = 'Statistics'
    statsDiv.appendChild(title)

    // Cria o div para exibir as estatísticas
    const statsDisplay = document.createElement('div')
    statsDisplay.id = 'stats-display'
    statsDiv.appendChild(statsDisplay)
    this.statisticsDisplay = statsDisplay
    return statsDiv
  }

  updateStatsDisplay() {
    const stats = []
    stats.push(`Generation: ${this.neat.generation}`)
    stats.push(`Best Fitness: ${this.neat.bestGenome?.fitness.toFixed(4)}`)
    stats.push(`Population Size: ${this.neat.population.length}`)
    stats.push(`Nodes: ${this.neat.bestGenome?.nodes.length}`)
    stats.push(`Connections: ${this.neat.bestGenome?.connections.length}`)
    this.statisticsDisplay.textContent = stats.join('\n')
  }

  updateChart() {
    if (!this.fitnessChart) {
      throw new Error('no fitness chart created')
    }

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
      this.updateStatsDisplay()

      if ((this.neat.bestGenome?.fitness || 0) >= this.targetFitness) {
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
    this.updateStatsDisplay()
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
