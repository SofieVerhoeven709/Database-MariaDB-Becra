import {useEffect, useState} from 'react'

async function getCookie(name: string): Promise<string | undefined> {
  const cookie = await window.cookieStore.get(name)
  return cookie?.value
}

/**
 * Retrieve a cookie from the CookieStore.
 *
 * @param name The name of the cookie to retrieve.
 */
export function useCookie(name: string): string | undefined {
  const [cookie, setCookie] = useState<string | undefined>('')

  useEffect(() => {
    void getCookie(name).then(setCookie)
  }, [name])

  return cookie
}
