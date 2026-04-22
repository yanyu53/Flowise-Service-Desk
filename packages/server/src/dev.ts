import * as Server from './index'
import * as DataSource from './DataSource'
import logger from './utils/logger'

async function main() {
    logger.info('Starting Flowise (dev)...')
    await DataSource.init()
    await Server.start()
}

main().catch((err) => {
    logger.error('Flowise (dev) crashed:', err)
    process.exit(1)
})

