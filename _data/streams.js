require('dotenv').config()

const apiKey = process.env.AIRTABLE_API_KEY;
const airtable = require('airtable');
const Bottleneck = require('bottleneck');
const base = new airtable({apiKey}).base('appJLjzz4zyFkZcO3');

const compareStreams = (a, b) => {
	const streamA = new Date(a.startTime);
	const streamB = new Date(b.startTime);
	
	let comparison = 0;

	if (streamA.getTime() > streamB.getTime()) {
		comparison = 1;
	} else if (streamA.getTime() < streamB.getTime()) {
		comparison = -1;
	}

	return comparison;
};

module.exports = async function() {
	return new Promise((resolve, reject) => {
		const limiter = new Bottleneck({minTime: 1000 / 5});
		const streams = [];

		limiter.wrap(base('Streams').select({
			filterByFormula: "IS_AFTER({End Time}, NOW())"
		}).eachPage(function page(records, fetchNextPage) {
			records.forEach(function(record) {
				const name = record.get('Name');
				const link = record.get('Link');
				const photo = record.get('Photo');
				const startTime = record.get('Start Time');
				const endTime = record.get('End Time');
				const creatorName = record.get('Creator Name');
				const creatorLink = record.get('Creator Link');
				const platform = record.get('Platform') || false;
				const subject = record.get('Subject');
				const ageRange = record.get('Age Range');
				streams.push({name, link, photo, startTime, endTime, creatorName, creatorLink, platform, subject, ageRange});
			});
			fetchNextPage();
		}, function done(err) {
			if (err) {
				console.error(err);
				reject(error);
			}
			resolve({items: streams.sort(compareStreams)});
		}));
	});
}
