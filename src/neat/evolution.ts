import { Chart, registerables } from "chart.js"
import Genome from "./genome"
import NEAT from "./neat"

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
  inputSize: number
  outputSize: number
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
  private currentGenome: Genome | null
  private seeBestGenome: boolean = true
  private inputSize: number
  private outputSize: number

  constructor({ inputSize, outputSize, canvasWidth, canvasHeight, populationCanvasWidth, populationCanvasHeight, targetFitness, populationSize, connectionMutationRate, weightMutationRate, nodeMutationRate }: EvolutionParams) {
    this.isEvolutionRunning = false
    this.targetFitness = targetFitness
    this.populationSize = populationSize
    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight
    this.populationCanvasWidth = populationCanvasWidth
    this.populationCanvasHeight = populationCanvasHeight
    this.inputSize = inputSize
    this.outputSize = outputSize

    this.weightMutationRate = weightMutationRate
    this.nodeMutationRate = nodeMutationRate
    this.connectionMutationRate = connectionMutationRate
    this.currentGenome = null
    
    this.createView()
    this.initializeNEAT()
    this.initializeChart()
  }

  initializeNEAT() {
    this.neat = new NEAT({
      populationSize: this.populationSize,
      inputSize: this.inputSize,
      outputSize: this.outputSize,
      canvasWidth: this.networkCanvas?.clientWidth || 0,
      canvasHeight: this.networkCanvas?.clientHeight || 0,
      weightMutationRate: this.weightMutationRate,
      nodeMutationRate: this.nodeMutationRate,
      connectionMutationRate: this.connectionMutationRate,
    })
    this.neat.bestGenome = this.neat.population[0].clone()
    this.currentGenome = this.neat.bestGenome
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
    startButton.onclick = () => {
      if (this.isEvolutionRunning) {
        this.pauseEvolution()
        startButton.textContent = 'Resume Evolution'
      } else {
        this.startEvolution()
        startButton.textContent = 'Pause Evolution'
      }
    }

    controlsDiv.appendChild(startButton)

    // Botão Reset
    const resetButton = document.createElement('button')
    resetButton.textContent = 'Reset'
    resetButton.onclick = () => {
      this.resetEvolution()
      startButton.textContent = 'Start Evolution'
    }
    controlsDiv.appendChild(resetButton)

    const seeBestButton = document.createElement('button')
    seeBestButton.textContent = 'See best'
    seeBestButton.onclick = () => {
      this.seeBestGenome = true
    }
    controlsDiv.appendChild(seeBestButton)

    const genome = document.createElement('input')
    genome.id = 'genome'
    genome.type = 'number'
    genome.min = '0'
    genome.placeholder = 'Choose a genome'
    genome.onchange = (e: any) => {
      const index = parseInt(e.target.value)
      if (index <= this.neat.population.length) {
        this.seeBestGenome = false
        this.currentGenome = this.neat.population[index]
        console.log(this.currentGenome)
      } else {
        console.log('Index out of bonds :(', index)
      }
    }

    controlsDiv.appendChild(genome)

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
    populationInput.value = `${this.populationSize}`
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
    fitnessInput.value = `${this.targetFitness}`
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
    weightInput.value = `${this.weightMutationRate}`
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
    nodeInput.value = `${this.nodeMutationRate}`
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
    connectionInput.value = `${this.connectionMutationRate}`
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
    stats.push(`Population Size: ${this.neat.population.length}`)
    stats.push(`Genome Id: ${this.currentGenome?.id}`)
    stats.push(`Fitness: ${this.currentGenome?.fitness.toFixed(4)}`)
    stats.push(`Nodes: ${this.currentGenome?.nodes.length}`)
    stats.push(`Connections: ${this.currentGenome?.connections.length}`)
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
      
      if (this.seeBestGenome) {
        this.currentGenome = this.neat.bestGenome
      }

      this.drawNetwork(this.currentGenome)
      this.updateChart()
      this.updateStatsDisplay()

      if ((this.neat.bestGenome?.fitness || 0) >= this.targetFitness) {
        this.pauseEvolution()
        alert("Solution found!")
      }
    }, 100)
  }

  pauseEvolution() {
    console.log(this)
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
    this.drawNetwork(this.currentGenome)
    this.updateStatsDisplay()
  }

  drawNetwork(genome: Genome | null) {
    if (!genome) {
      return
    }
    
    this.networkCtx.clearRect(0, 0, this.networkCanvas.width, this.networkCanvas.height)

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
      this.networkCtx.font = "12px Arial";
      this.networkCtx.fillStyle = "black";
      const offsetX = node.id > 9 ? 6 : 4
      const offsetY = node.id > 9 ? 5 : 4
      this.networkCtx.fillText(`${node.id}`,node.x - offsetX,node.y + offsetY);
    })
  }
}
