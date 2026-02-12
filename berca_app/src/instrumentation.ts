import {getLogger} from '@/lib/logger'
import {indentMultiline} from '@/lib/utils'

export function register() {
  console.error = async (...args: string[]) => {
    const logger = await getLogger()
    logger.error(indentMultiline(args.join('\n')))
  }

  console.warn = async (...args: string[]) => {
    const logger = await getLogger()
    logger.warn(indentMultiline(args.join('\n')))
  }

  console.debug = async (...args: string[]) => {
    const logger = await getLogger()
    logger.debug(indentMultiline(args.join('\n')))
  }

  console.log = async (...args: string[]) => {
    const logger = await getLogger()
    logger.info(indentMultiline(args.join('\n')))
  }
}
