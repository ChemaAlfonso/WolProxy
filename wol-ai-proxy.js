const path = require('path')
const dotenv = require('dotenv')
dotenv.config({ path: path.join(__dirname, './.env') })

const express = require('express')
const wol = require('wake_on_lan')
const { createProxyMiddleware } = require('http-proxy-middleware')

// ===================================
// Logger basic implementation
// ===================================
/**
 * @param {Error | string} error
 * @param {string} type
 * @returns {void}
 *
 * @example
 * logger('This is an error', 'error')
 * logger(new Error('This is an error'), 'error')
 * logger('This is a warning', 'warn')
 * logger('This is an info', 'info')
 */
const logger = (error, type = 'info') => {
	const message = error instanceof Error ? error.message : error
	console[type](`[WoL] [${new Date().toISOString()}] ${message}`)
}

// ===================================
// Config
// ===================================
const config = {
	proxyTo: process.env.PROXY_TO,
	port: process.env.PORT,
	wol: {
		macAddress: process.env.MAC_ADDRESS,
		checkTimeout: process.env.CHECK_TIMEOUT || 5000,
		checkInterval: process.env.CHECK_INTERVAL || 5000,
		maxWaitTime: process.env.MAX_WAIT_TIME || 60000
	}
}

if (!config.proxyTo || !config.port || !config.wol.macAddress) {
	logger('Missing required environment variables. Exiting...', 'error')
	process.exit(1)
}

// ===================================
// WoL
// ===================================
/*
 * @param {string} mac
 * @returns {Promise<string>}
 *
 * @example
 * wakeOnLan('00:11:22:33:44:55')
 */
const wakeOnLan = async mac => {
	return new Promise((resolve, reject) => {
		wol.wake(mac, function (error) {
			if (error) {
				reject('Error sending magic packet')
			} else {
				resolve('Magic packet sent successfully')
			}
		})
	})
}

/*
 * @returns {Promise<boolean>}
 *
 * @example
 * const hostOnline = await isHostOnline()
 */
const isHostOnline = async () => {
	const controller = new AbortController()
	const timeout = setTimeout(() => {
		controller.abort()
	}, config.wol.checkTimeout)

	try {
		const response = await fetch(`${config.proxyTo}`, { signal: controller.signal })
		clearTimeout(timeout)
		return response.ok
	} catch (error) {
		if (error.name === 'AbortError') {
			logger('Fetch request timed out')
		} else {
			logger(error)
		}
		return false
	}
}

// ===================================
// Init app
// ===================================
const app = express()

// Base status endpoint
app.get('/wolstatus', async (req, res) => {
	const hostOnline = await isHostOnline()
	res.send({
		ok: true,
		server: 'ok',
		proxiedService: hostOnline ? 'ok' : 'ko'
	})
})

// ===================================
// WoL Middleware
// ===================================
app.use(async (req, res, next) => {
	if (!(await isHostOnline())) {
		logger('System is offline. Sending WoL magic packet...')

		await wakeOnLan(config.wol.macAddress)

		let hostOnline = false
		const start = Date.now()

		while (!hostOnline && Date.now() - start < config.wol.maxWaitTime) {
			hostOnline = await isHostOnline()
			if (!hostOnline) await new Promise(resolve => setTimeout(resolve, config.wol.checkInterval))
		}

		if (!hostOnline) return res.status(504).send('The system did not turn on in time.')
	}

	logger('Proxied system is on, continuing...')

	next()
})

// ===================================
// Proxy Middleware
// ===================================
app.use(
	'/',
	createProxyMiddleware({
		target: config.proxyTo,
		changeOrigin: true
	})
)

// ===================================
// Server start
// ===================================
app.listen(config.port, () => {
	logger(`WoL proxy server is running on port ${config.port}`)
})
