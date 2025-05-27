"use strict";
var baseu = 'https://www.digpotatoes.co.uk/';
var cacheName = 'DIGAPP-v1';
var appShellFiles = [
	'/dig_app/index.html',
	'/dig_app/app.js',
	'/dig_app/css/themes/dig.css',
	'/dig_app/css/themes/images/ajax-loader.gif',
	'/dig_app/css/style.css',
	'/dig_app/js/jquery-2.2.4.min.js',
	'/dig_app/js/jquery.mobile-1.4.5/jquery.mobile-1.4.5.js',
	'/dig_app/js/jSignature.min.js',
	'/dig_app/css/jquery.mobile.icons.min.css',
	'/dig_app/js/jquery.mobile-1.4.5/jquery.mobile.structure-1.4.5.css',
	'/dig_app/favicon.ico',
	'/dig_app/img/app_icon_boxcount.png',
	'/dig_app/img/app_icon_dress.png',
	'/dig_app/img/app_icon_dress_alert.png',
	'/dig_app/img/ico_inspec.png',
	'/dig_app/img/app_icon_testdig.png',
	'/dig_app/img/app_icon_home.png',
	'/dig_app/img/arrow_r.png',
	'/dig_app/img/arrow_r_l.png',
	'/dig_app/img/arrow_r_r.png',
	'/dig_app/img/dig_back.png',
	'/dig_app/img/logo_digdata.png',
	'/dig_app/img/logo_digdata_nav.png',
	'/dig_app/img/logo_mini.png',
	'/dig_app/icons/icon-48.png',
	'/dig_app/icons/icon-72.png',
	'/dig_app/icons/icon-96.png',
	'/dig_app/icons/icon-128.png',
	'/dig_app/icons/icon-192.png',
	'/dig_app/icons/icon-384.png',
	'/dig_app/icons/icon-512.png'
];



function revalidateResource(request)
{
	return new Promise(async resolve =>
	{
		let remote_response = await fetch(request);
		let file_cache = await caches.open(cacheName);
		if (request.method.toLowerCase() == 'get') {
			console.info('[Service Worker] Dynamic add to cache » ' + request.url);
			file_cache.put(request, remote_response.clone());
		}

		// console.debug(remote_response);

		resolve(remote_response);
	});

}

async function fetchStaleWhileRevalidate(request)
{
	let cache_response = caches.match(request);

	// let response_clone = cache_response.clone();
	// console.debug(response_clone.text());
	// response_clone.text().then(body => console.debug('Cache response body -> ', body));

	let remote_response = revalidateResource(request);

	// console.debug(remote_response);

	return (await cache_response) || (await remote_response);
}

async function fetchCacheFirst(request)
{
	let cache_response = await caches.match(request);

	console.debug('[Service Worker] Local cache check ', cache_response, ' for ', request.url);

	if (cache_response) return cache_response;

	return fetch(request);
}


// Installing Service Worker
self.addEventListener('install', function (e)
{
	console.info('[Service Worker] Install');
	e.waitUntil(
		caches.open(cacheName).then(function (cache)
		{
			console.info('[Service Worker] Caching all: appshell and content');
			return cache.addAll(appShellFiles);
		})
	);
});

// Fetching content using Service Worker
self.addEventListener('fetch', function (event)
{
	if (event.request.method.toUpperCase() == 'POST') {
		console.info('[Service Worker] Ignore Post');
		// return;
		event.respondWith(fetch(event.request));
	}

	if (event.request.url.match(/^.*\/dig_app\/[\w]*\.(?:js|html)$/)) 
		event.respondWith(fetchStaleWhileRevalidate(event.request));
	else event.respondWith(fetchCacheFirst(event.request));
});
