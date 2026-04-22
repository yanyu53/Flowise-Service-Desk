import path from 'path'
import dotenv from 'dotenv'

let loaded = false

/**
 * Load server .env once (packages/server/.env).
 * We keep override=true to preserve existing behavior.
 */
export function loadEnvOnce(): void {
    if (loaded) return
    const envPath = path.join(__dirname, '..', '..', '.env')
    dotenv.config({ path: envPath, override: true })
    loaded = true
}

