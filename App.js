import React, {Component} from 'react';
import { Platform, StyleSheet, Text, View, AsyncStorage } from 'react-native';
import firebase from 'react-native-firebase';
import type { Notification, NotificationOpen } from 'react-native-firebase';
import type { RemoteMessage } from 'react-native-firebase';
import axios from 'axios';

type Props = {};
export default class App extends Component<Props> {

  async componentDidMount() {

      const notificationOpen: NotificationOpen = await firebase.notifications().getInitialNotification();

      if (notificationOpen) {
        const action = notificationOpen.action;
        const notification: Notification = notificationOpen.notification;
        var seen = [];
        alert(JSON.stringify(notification.data, function(key, val) {
          if (val != null && typeof val == "object") {
            if (seen.indexOf(val) >= 0) {
              return;
            }
            seen.push(val);
          }
          return val;
        }));
      }

      const channel = new firebase.notifications.Android.Channel('test-channel', 'Test Channel', firebase.notifications.Android.Importance.Max)
      .setDescription('My apps test channel');

      firebase.notifications()
        .android
        .createChannel(channel);

      this.notificationDisplayedListener = firebase.notifications().onNotificationDisplayed((notification: Notification) => {
      });

      this.notificationListener = firebase.notifications().onNotification((notification: Notification) => {
          notification
              .android.setChannelId('test-channel')
              .android.setSmallIcon('ic_launcher');
          firebase.notifications()
              .displayNotification(notification);
      });

      this.notificationOpenedListener = firebase.notifications().onNotificationOpened((notificationOpen: NotificationOpen) => {
        const action = notificationOpen.action;
        const notification: Notification = notificationOpen.notification;
        var seen = [];
        alert(JSON.stringify(notification.data, function(key, val) {
          if (val != null && typeof val == "object") {
            if (seen.indexOf(val) >= 0) {
                return;
            }
            seen.push(val);
          }
          return val;
        }));
        firebase.notifications().removeDeliveredNotification(notification.notificationId);
      });

      this.checkPermission();
    }

    async receiveToken() {
      let fcmToken = await AsyncStorage.getItem('fcmToken');
      if (!fcmToken) {
          fcmToken = await firebase.messaging().getToken();
          if (fcmToken) {
              await AsyncStorage.setItem('fcmToken', fcmToken);
              axios.post('http://propush.pa.gov.br/api/v1/installation', {
                device_token: fcmToken,
                app_identifier: 'com.projeto_watcher',
                app_name: 'Watcher',
                app_version: '1.0',
                device_type: 'Android'
              }, {
                headers: {
                  ApplicationID: 'rBdP25zmoWvoGLr0hUIfQy7gK7XLiAm04veyJ9Qg',
                  ClientKey: 'AFpEE6EkZpmTgzLCmW2tEuzSNmPUV6sSHqyjTJRV'
                }
              })
              .then(res => console.warn(res))
              .catch(err => console.warn(err))
          }
      }

    }

    async requestPermission() {
      try {
          await firebase.messaging().requestPermission();
          this.receiveToken();
      } catch (error) {
          console.warn('permission rejected');
      }
    }

    async checkPermission() {
      const enabled = await firebase.messaging().hasPermission();
      if (enabled) {
          this.receiveToken();
      } else {
          this.requestPermission();
      }
    }

    componentWillUnmount() {
        this.notificationDisplayedListener();
        this.notificationListener();
        this.notificationOpenedListener();
    }

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>Welcome to Watcher</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});
