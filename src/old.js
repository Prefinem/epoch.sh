import { LambdaProxy, runner } from './framework';
import Mustache from 'mustache';
import _ from 'lodash';
import fs from 'fs';
import moment from 'moment-timezone';
import request from 'request';

class Run {
	constructor(event) {
		this.repsonseType = 'api';
		if (_.get(event, 'headers.Host', '') === 'epoch.sh') {
			this.responseType = 'site';
		}
		this.ua = _.get(event, 'requestContext.identity.userAgent', '');
		this.ip = _.get(event, 'requestContext.identity.sourceIp', '');
		this.queryParams = _.get(event, 'queryStringParameters');
		this.queryParams = this.queryParams || {};

		const time = _.get(event, 'pathParameters.time', '');

		this.setTime(time);
	}

	setTime(time) {
		try {
			if (time === '') {
				this.time = moment();
			} else if (isNaN(time)) {
				this.time = moment(time);
			} else if (`${time}`.length < 13) {
				this.time = moment.unix(parseInt(time));
			} else {
				this.time = moment.unix(time / 1000);
			}
		} catch (error) {
			this.error = 'invalid data';
		}
	}

	geoLocate() {
		return new Promise((resolve) => {
			request.get(`http://ip-api.com/json/${this.ip}`, (error, response) => {
				if (error || !response.body) {
					resolve({});
				} else {
					resolve(JSON.parse(response.body));
				}
			});
		});
	}

	async getTimezone() {
		const geo = await this.geoLocate();

		return geo.timezone || '';
	}

	generateHTML() {
		const template = fs.readFileSync('template.mustache').toString();
		const data = {
			local: this.time.tz(this.timezone).format(),
			localPretty: this.time.tz(this.timezone).format('llll'),
			unix: this.time.unix(),
			utc: this.time.utc().format(),
			utcPretty: this.time.utc().format('llll'),
		};

		return Mustache.render(template, data);
	}

	async run() {
		this.timezone = await this.getTimezone();

		const data = {
			local: this.time.tz(this.timezone).format(),
			unix: this.time.unix(),
			utc: this.time.utc().format(),
		};

		if (this.responseType === 'site' || this.queryParams.html) {
			const html = this.generateHTML();

			return new LambdaProxy().html(html);
		}

		if (this.error) {
			return { error: this.error };
		}

		return data;
	}
}

exports.handle = async (event, context) => {
	await runner(Run, event, context);
};
