import "./evolution-app.css"
import { Evolution, EvolutionParams } from "./neat/evolution"

const params: EvolutionParams = {
  canvasWidth: 550,
  canvasHeight: 400,
  populationCanvasWidth: 500,
  populationCanvasHeight: 400,
  populationSize: 150,
  targetFitness: 0.95,
  weightMutationRate: 0.9,
  nodeMutationRate: 0.1,
  connectionMutationRate: 0.15,
  inputSize: 2,
  outputSize: 1,
  crossoverRate: 0.8,
}
const evolution = new Evolution(params)
document.querySelector<HTMLDivElement>("#app")!.appendChild(evolution.view)
console.log(evolution)
