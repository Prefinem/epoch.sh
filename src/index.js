const Mustache = require('mustache');
const lambdify = require('lambdify');
const fs = require('fs');
const path = require('path');
const { env } = process;
const isLocal = env.IS_LOCAL || env.IS_OFFLINE;
const srcDir = isLocal ? path.resolve(path.join('./', 'src')) : path.join('/var', 'task', 'src');

const getTime = (time) => {
	if (!time) {
		return new Date();
	} else if (/[0-9]{13,}/u.test(time)) {
		return new Date(parseInt(time));
	} else if (/[0-9]{1,13}/u.test(time)) {
		return new Date(parseInt(time) * 1000);
	}

	return new Date(time);
};

const prettyTime = (time) =>
	time
		.split(' ')
		.slice(0, 5)
		.join(' ');

const run = (request, response) => {
	if (request.getPathParams().time === 'favicon.ico') {
		return '';
	}

	const template = fs.readFileSync(`${srcDir}/template.mustache`).toString();
	const time = getTime(request.getPathParams().time);
	const data = {
		local: time.toString(),
		localPretty: prettyTime(time.toString()),
		unix: Math.floor(time.getTime() / 1000),
		utc: time.toUTCString(time.toString()),
		utcPretty: prettyTime(time.toUTCString()),
	};
	const html = Mustache.render(template, data);

	return typeof request.getQueryParams().json === 'undefined' ? response.html(html) : response.json(data);
};

exports.handler = lambdify(run);
