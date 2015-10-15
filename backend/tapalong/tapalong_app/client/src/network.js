// TODO: refactor so when adding we don't have to cast string to date here, but it is done in the model
// TODO: Refactor out dependency on models
// var models = require('./models.js');

var sessionToken;
var userId;

var setSessionToken = function(newSessionToken) {
  sessionToken = newSessionToken;
}

var setUserId = function(newUserId) {
  userId = newUserId;
}

var login = function (fb_token, success, failure) {
  console.log('Logging in to the app');
  sendRequest('/../v1/login/', 'post', JSON.stringify({fb_token: fb_token}), function() {
    if(this.status >= 200 && this.status < 400) {
      console.log(this.responseText);
      response = JSON.parse(this.responseText);
      if (response.success === 'true') {
        success(response.user_id, response.user_name, response.session_token);
      } else {
        failure();
        throw('unexpected app login failure');
      }
    } else {
      // Request failed
      throw ('login request failed');
    }
  });
};
var getActivitiesFromJSON = function (responseText) {
  // Strip activity label for each item
  var activities = JSON.parse(responseText).map(function (activity) {
    // Parse the datetimes into actual objects
    activity.start_time = new Date(activity.start_time);
    return activity.activity;
  });
  return activities;
};
var getActivitiesFromServer = function (success, failure) {
  sendRequest('/../v1/activities/visible_to_user/', 'get', '', function() {
    if (this.status >= 200 && this.status < 400) {
      // TODO: Check this actually succeeded
      var activities = getActivitiesFromJSON(this.responseText);
      success(activities);
    } else {
      failure();
    }
  });
};
var requestCreateActivity = function (activity, success, failure) {
  sendRequest('/../v1/activities/visible_to_user/', 'post', JSON.stringify(activity), function() {
    if(this.status >= 200 && this.status < 400) {
      var activity = JSON.parse(this.responseText).activity;
      activity.start_time = new Date(activity.start_time);
      success(activity);
    } else {
      console.log('Server error: ', this.responseText)
      failure();
    }
  });
};
var requestSetAttending = function (activity, attending, optimistic, success, failure) {
  if (optimistic) {
    console.log('Set attending optimistically!');
    // TODO: do a more efficient copy!
    var activityCopy = JSON.parse(JSON.stringify(activity));
    // Parse the start_time since we serialized it in the copy :(
    activityCopy.start_time = new Date(activityCopy.start_time);
    activityCopy.is_attending = attending;
    var userName = models.user.getUserName();
    if (attending) {
      activityCopy.attendees.push(userName);
    } else {
      activityCopy.attendees = activityCopy.attendees.filter(function(attendeeName) {
        return attendeeName !== userName;
      });
    }
    activityCopy.dirty = true;
    models.activities.updateActivity(activityCopy.id, activityCopy);
  }
  sendRequest('/../v1/activities/'+activity.activity_id+'/attend/', 'post', JSON.stringify({attending: attending}), function () {
    if(this.status >= 200 && this.status < 400) {
      var updatedActivity = JSON.parse(this.responseText).activity;
      updatedActivity.start_time = new Date(updatedActivity.start_time);
      updatedActivity.id = activity.id;
      // Note updatedAcitivy won't have dirty set
      models.activities.updateActivity(updatedActivity.id, updatedActivity);
      success();
    } else {
      failure();
    }
  });
};
var requestUpdateActivity = function(activity, activityChanges, success, failure) {
  sendRequest('/../v1/activities/'+activity.activity_id+'/', 'post', JSON.stringify(activityChanges), function () {
    if(this.status >= 200 && this.status < 400) {
      var updatedActivity = JSON.parse(this.responseText).activity;
      updatedActivity.start_time = new Date(updatedActivity.start_time);
      updatedActivity.id = activity.id;
      models.activities.updateActivity(updatedActivity.id, updatedActivity);
      success();
    } else {
      failure();
    }
  });
};
var requestCancelActivity = function (activity, success, failure) {
  sendRequest('/../v1/activities/'+activity.activity_id+'/cancel/', 'post', '', function () {
    if(this.status >= 200 && this.status < 400) {
      models.activities.removeActivity(activity.id);
      success();
    } else {
      failure();
    }
  })
};
var requestCreatePushNotificationsSubscription = function (subscription) {
  sendRequest('/../v1/push_subscriptions/', 'post', JSON.stringify(subscription), function () {});
};
var sendRequest = function (url, method, body, onload) {
  var req = new XMLHttpRequest();
  req.onload = onload;
  req.open(method, url, true);
  // Only set session_token and user_id if the user is logged in.
  if (sessionToken !== undefined && userId !== undefined) {
    req.setRequestHeader('Session-Token', sessionToken);
    req.setRequestHeader('User-Id', userId);
  } else {
    console.log('Sending an unauthenticated request since we haven\'t logged in yet');
  }
  req.setRequestHeader('Content-Type', 'application/json');
  // Why is there a settimeout here?
  setTimeout(function() {
    req.send(body);
  }, 0);
}
var sendToServiceWorker = function (data) {
  navigator.serviceWorker.controller.postMessage(data);
}

module.exports = {
  setSessionToken: setSessionToken,
  setUserId: setUserId,
  getActivitiesFromServer: getActivitiesFromServer,
  requestCreateActivity: requestCreateActivity,
  requestSetAttending: requestSetAttending,
  requestUpdateActivity: requestUpdateActivity,
  requestCancelActivity: requestCancelActivity,
  requestCreatePushNotificationsSubscription: requestCreatePushNotificationsSubscription,
  login: login
};
