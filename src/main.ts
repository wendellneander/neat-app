import './evolution-app.css'
import { Evolution, EvolutionParams } from './neat/evolution'

const params: EvolutionParams = {
  canvasWidth: 500,
  canvasHeight: 500,
  populationCanvasWidth: 500,
  populationCanvasHeight: 500,
  populationSize: 10,
  solutionFitness: 95
}
const evolution = new Evolution(params)
document.querySelector<HTMLDivElement>('#app')!.innerHTML = evolution.view
evolution.startEvolution()
