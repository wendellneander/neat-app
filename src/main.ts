import "./evolution-app.css"
import { Evolution, EvolutionParams } from "./neat/evolution"

const params: EvolutionParams = {
  canvasWidth: 550,
  canvasHeight: 400,
  populationCanvasWidth: 500,
  populationCanvasHeight: 400,
  populationSize: 10,
  targetFitness: 0.95,
  weightMutationRate: 0.7,
  nodeMutationRate: 0.03,
  connectionMutationRate: 0.06,
  inputSize: 2,
  outputSize: 1,
  crossoverRate: 0.3,
}
const evolution = new Evolution(params)
document.querySelector<HTMLDivElement>("#app")!.appendChild(evolution.view)
console.log(evolution)
