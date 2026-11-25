import { describe, it, expect } from 'vitest'
import { getSceneSize } from '../src/features/quote/utils/sceneSize'

const p = (x: number, y: number, z: number) => ({ x, y, z })

describe('getSceneSize (3D viewer framing)', () => {
  it.each([
    ['x', p(30, 10, 20), 30, 10],
    ['y', p(10, 40, 20), 40, 40],
    ['z', p(10, 20, 50), 50, 20],
  ])('uses the largest dimension (%s)', (_axis, max, maxDim, sizeY) => {
    expect(getSceneSize(p(0, 0, 0), max)).toEqual({ sizeY, maxDim })
  })

  it('measures from min to max, not from the origin', () => {
    expect(getSceneSize(p(-5, -5, -5), p(5, 10, 5))).toEqual({ sizeY: 15, maxDim: 15 })
  })

  it('never frames a model smaller than 1 mm', () => {
    expect(getSceneSize(p(0, 0, 0), p(0.1, 0.2, 0.3))).toEqual({ sizeY: 0.2, maxDim: 1 })
  })

  it('treats inverted bounds as zero height', () => {
    expect(getSceneSize(p(0, 5, 0), p(10, 0, 10))).toEqual({ sizeY: 0, maxDim: 10 })
  })

  it('falls back for the infinite bounds of empty geometry', () => {
    expect(getSceneSize(p(Infinity, Infinity, Infinity), p(-Infinity, -Infinity, -Infinity))).toEqual({ sizeY: 0, maxDim: 20 })
  })

  it.each([
    ['x', p(NaN, 10, 10), 10],
    ['y', p(10, NaN, 10), 0],
    ['z', p(10, 10, NaN), 10],
  ])('falls back when %s is NaN', (_axis, max, sizeY) => {
    expect(getSceneSize(p(0, 0, 0), max)).toEqual({ sizeY, maxDim: 20 })
  })
})
