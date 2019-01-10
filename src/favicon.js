const lambdify = require('lambdify');
const fs = require('fs');
const path = require('path');
const { env } = process;
const isLocal = env.IS_LOCAL || env.IS_OFFLINE;
const srcDir = isLocal ? path.resolve(path.join('./', 'src')) : path.join('/var', 'task', 'src');

const run = (request, response) => {
	const image = fs.readFileSync(path.join(srcDir, 'favicon.ico')).toString('base64');

	return response.binary(image, 'image/x-icon');
};

exports.handler = lambdify(run);
