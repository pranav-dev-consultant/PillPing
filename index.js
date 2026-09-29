/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';
import notifee from '@notifee/react-native';
import { handleNotificationEvent } from './src/services/notifications/notificationService';

notifee.onBackgroundEvent(async event => {
	await handleNotificationEvent(event);
});

AppRegistry.registerComponent(appName, () => App);
