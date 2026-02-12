/**
 * A utility function which takes FormData submitted from the client as an argument and returns a JavaScript object.
 * This function works for both nested array and object keys. A key like foo.bar.0 would translate to {foo: {bar: []}}.
 *
 * @param data The FormData submitted from the client through an HTTP POST.
 */
export function convertFormData<T>(data: FormData): T {
  const result: Record<string, unknown> = {}

  // Verwijder alle keys die beginnen met $ACTION.
  // Dit zijn interne dingen die door Next.js worden toegevoegd.
  const keys = Array.from(data.keys()).filter(key => !key.startsWith('$ACTION'))

  // Controleer of er keys zijn die meerdere keren voorkomen (checkbox groups en selects met multiple).
  const keyCounts: Record<string, number> = {}
  keys.forEach(key => (keyCounts[key] = keyCounts[key] ? keyCounts[key] + 1 : 1))

  // Voeg alle top-level keys toe aan het resultaat.
  keys
    .filter(key => !key.includes('.'))
    .forEach(key => {
      if (keyCounts[key] > 1) {
        result[key] = data.getAll(key)
      } else {
        result[key] = data.get(key)
      }
    })

  // Vorm geneste form data met keys zoals arrayName.index.key en objectNaam.object.key om naar een object.
  const multipartKeys = keys.filter(key => key.includes('.'))
  // Sorteer zodat we eerst de elementen op positie 0 in de array krijgen en dan de elementen op positie 1, enz.
  multipartKeys.sort()

  for (const multipartKey of multipartKeys) {
    const keyParts = multipartKey.split('.')
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    let current: any = result

    for (let i = 0; i < keyParts.length; i++) {
      const keyPart = keyParts[i]

      // Als dit het laatste element is, moet dit de naam van een property zijn.
      if (i === keyParts.length - 1) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        current[keyPart] = data.get(multipartKey)
        continue
      }

      // Als de key nog niet in het resultaat zit moet deze aangemaakt worden.
      // De key kan al bestaand als deze voorkwam in een eerder verwerkte multi-part key

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (!current[keyPart]) {
        // Als de volgende key een nummer is, moeten we een array aanmaken omdat het nummer een index is.
        // In het andere geval moeten we een object aanmaken.

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        current[keyPart] = isNaN(parseInt(keyParts[i + 1])) ? {} : []
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      current = current[keyPart]
    }
  }

  return result as T
}