type Plain = Record<string, unknown>

function isPlainObject(value: unknown): value is Plain {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Deep-merges plain objects. Values from `source` override `target`; nested
 * plain objects are merged recursively. Arrays and primitives are replaced,
 * not merged. Used to layer app i18n messages over @pinboard/ui defaults so
 * app keys take precedence.
 */
export function mergeDeep<T extends Plain>(target: T, source: Plain): T {
  const output: Plain = { ...target }
  for (const key of Object.keys(source)) {
    const sourceValue = source[key]
    const targetValue = output[key]
    if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
      output[key] = mergeDeep(targetValue, sourceValue)
    } else {
      output[key] = sourceValue
    }
  }
  return output as T
}
