import { toValue, type Ref } from 'vue'
import type { Dimensions } from '@/types'

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
  container: Dimensions | Ref<Dimensions>
): {
  image: Dimensions
  container: Dimensions
} {
  const imageVal = toValue(image)
  const containerVal = toValue(container)
  const widthLessThanHeight = containerVal.width <= containerVal.height
  return {
    image: getScale(imageVal, { height: 1, width: 1 }, widthLessThanHeight),
    container: getScale(imageVal, containerVal, widthLessThanHeight),
  }
}

export function getImageScale(image: Dimensions | Ref<Dimensions>): Dimensions {
  const imageVal = toValue(image)
  return getScale(imageVal, { height: 1, width: 1 }, imageVal.width <= imageVal.height)
}
