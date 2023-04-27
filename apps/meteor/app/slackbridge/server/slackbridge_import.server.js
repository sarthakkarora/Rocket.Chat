import { Match } from 'meteor/check';
import { Random } from '@rocket.chat/random';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { Rooms, Users } from '@rocket.chat/models';

import { SlackBridge } from './slackbridge';
import { msgStream } from '../../lib/server';
import { slashCommands } from '../../utils/server';

async function SlackBridgeImport({ command, params, message, userId }) {
	if (command !== 'slackbridge-import' || !Match.test(params, String)) {
		return;
	}

	const room = await Rooms.findOneById(message.rid);
	const channel = room.name;
	const user = await Users.findOneById(userId);

	msgStream.emit(message.rid, {
		_id: Random.id(),
		rid: message.rid,
		u: { username: 'rocket.cat' },
		ts: new Date(),
		msg: TAPi18n.__(
			'SlackBridge_start',
			{
				postProcess: 'sprintf',
				sprintf: [user.username, channel],
			},
			user.language,
		),
	});

	try {
		for await (const slack of SlackBridge.slackAdapters) {
			await slack.importMessages(message.rid, (error) => {
				if (error) {
					msgStream.emit(message.rid, {
						_id: Random.id(),
						rid: message.rid,
						u: { username: 'rocket.cat' },
						ts: new Date(),
						msg: TAPi18n.__(
							'SlackBridge_error',
							{
								postProcess: 'sprintf',
								sprintf: [channel, error.message],
							},
							user.language,
						),
					});
				} else {
					msgStream.emit(message.rid, {
						_id: Random.id(),
						rid: message.rid,
						u: { username: 'rocket.cat' },
						ts: new Date(),
						msg: TAPi18n.__(
							'SlackBridge_finish',
							{
								postProcess: 'sprintf',
								sprintf: [channel],
							},
							user.language,
						),
					});
				}
			});
		}
	} catch (error) {
		msgStream.emit(message.rid, {
			_id: Random.id(),
			rid: message.rid,
			u: { username: 'rocket.cat' },
			ts: new Date(),
			msg: TAPi18n.__(
				'SlackBridge_error',
				{
					postProcess: 'sprintf',
					sprintf: [channel, error.message],
				},
				user.language,
			),
		});
		throw error;
	}
}

slashCommands.add({ command: 'slackbridge-import', callback: SlackBridgeImport });
