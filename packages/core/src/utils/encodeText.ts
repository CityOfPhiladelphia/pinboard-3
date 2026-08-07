// converts characters in a string to a string of the characters' hex values
// lower case ascii characters are unchanged
export function stringToCharCode(str: string) {
  const encodedString = Array.from(str.split(''), (char) =>
    isLowerCaseAscii(char) ? char : char.charCodeAt(0).toString(16).padStart(4, '0').toUpperCase()
  ).join('')
  return encodedString
}

// inverse of stringToCharCode
export function charCodeToString(str: string) {
  const decodedString: string[] = []
  let i = 0
  while (i < str.length) {
    if (isLowerCaseAscii(str.charAt(i))) {
      decodedString.push(str.charAt(i++))
    } else {
      decodedString.push(String.fromCharCode(Number.parseInt(str.substring(i, (i += 4)), 16)))
    }
  }
  return decodedString.join('')
}

function isLowerCaseAscii(char: string | number) {
  const code = typeof char === 'number' ? char : char.charCodeAt(0)
  return 97 <= code && code <= 122
}
