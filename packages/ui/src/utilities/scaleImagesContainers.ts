import { toValue, type Ref } from 'vue'
import type { Dimensions } from '../types'

function getScale(dimA: Dimensions, dimB: Dimensions, widthLessThanHeight: boolean): Dimensions {
  return widthLessThanHeight
    ? {
        height: (dimA.height * dimB.width) / dimA.width,
        width: dimB.width,
      }
    : {
        height: dimB.height,
        width: (dimA.width * dimB.height) / dimA.height,
      }
}

export function scaleImageAndContainer(
  image: Dimensions | Ref<Dimensions>,
  container: Ref<HTMLDivElement | null>
): {
  image: Dimensions
  container: Dimensions
} {
  if (!container.value) {
    throw new Error('Container element was null')
  }
  const imageVal = toValue(image)
  const containerDim: Dimensions = {
    height: container.value.clientHeight,
    width: container.value.clientWidth,
  }
  const widthLessThanHeight = containerDim.width <= containerDim.height
  return {
    image: getScale(imageVal, { height: 1, width: 1 }, widthLessThanHeight),
    container: getScale(imageVal, containerDim, widthLessThanHeight),
  }
}

export function getImageScale(image: Dimensions | Ref<Dimensions>): Dimensions {
  const imageVal = toValue(image)
  return getScale(imageVal, { height: 1, width: 1 }, imageVal.width <= imageVal.height)
}

export function resizeContainerToImageAspectRatio(
  imageAspectRatio: Dimensions,
  container: Ref<HTMLDivElement | null>
): Dimensions {
  if (!container.value) {
    throw new Error('Container element was null')
  }
  const normalizedImageAr = normalizeAspectRatio(imageAspectRatio)
  const shortestContainerSide = Math.min(container.value.clientHeight, container.value.clientWidth)
  const containerDim: Dimensions = {
    height: shortestContainerSide * normalizedImageAr.height,
    width: shortestContainerSide * normalizedImageAr.width,
  }
  return containerDim
}

function normalizeAspectRatio(aspectRatio: Dimensions) {
  return {
    height: 1,
    width: aspectRatio.width / aspectRatio.height,
  }
}
