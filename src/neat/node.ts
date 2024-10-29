export enum NodeTypes {
  INPUT = "input",
  HIDDEN = "hidden",
  OUTPUT = "output",
}

export default class Node {
  id: number
  type: NodeTypes
  x: number
  y: number
  value: number

  constructor(
    id: number,
    type: NodeTypes,
    x: number = 0,
    y: number = 0,
    value: number = 0
  ) {
    this.id = id
    this.type = type
    this.x = x
    this.y = y
    this.value = value
  }
}
