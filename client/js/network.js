// TODO: refactor so when adding we don't have to cast string to date here, but it is done in the model
require('datejs');

var requestLogin = function (fb_token, success, failure) {
  console.log('Logging in to the app');
  sendRequest('/../v1/login/', 'post', JSON.stringify({fb_token: fb_token}), undefined, function() {
    if(this.status >= 200 && this.status < 400) {
      console.log(this.responseText);
      var response = JSON.parse(this.responseText);
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

var parseActivitiesFromJSON = function (responseText) {
  // Strip activity label for each item
  var activities = JSON.parse(responseText).map(function (activity) {
    // Note the list looks like [{activity: {...}}, ...]
    // Parse the datetimes into actual objects.
    activity.activity.start_time = new Date(activity.activity.start_time);
    return activity.activity;
  });
  return activities;
};

var requestActivitiesFromServer = function (user, success, failure) {
  sendRequest('/../v1/activities/visible_to_user/', 'get', '', user, function() {
    if (this.status >= 200 && this.status < 400) {
      // TODO: Check this actually succeeded
      var activities = parseActivitiesFromJSON(this.responseText);
      success(activities);
    } else {
      failure();
    }
  });
};

var requestCreateActivity = function (user, activity, success, failure) {
  sendRequest('/../v1/activities/visible_to_user/', 'post', JSON.stringify(activity), user, function() {
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

var requestSetAttending = function (user, activity, attending, optimistic, success, failure) {
  if (optimistic) {
    console.log('Set attending optimistically!');
    // TODO: do a more efficient copy!
    var activityCopy = JSON.parse(JSON.stringify(activity));
    // Parse the start_time since we serialized it in the copy :(
    activityCopy.start_time = new Date(activityCopy.start_time);
    activityCopy.is_attending = attending;
    var userName = user.getUserName();
    if (attending) {
      activityCopy.attendees.push(userName);
    } else {
      activityCopy.attendees = activityCopy.attendees.filter(function(attendeeName) {
        return attendeeName !== userName;
      });
    }
    activityCopy.dirty = true;
    success(activityCopy);
  }
  sendRequest('/../v1/activities/'+activity.activity_id+'/attend/', 'post', JSON.stringify({attending: attending}), user, function () {
    if(this.status >= 200 && this.status < 400) {
      var updatedActivity = JSON.parse(this.responseText).activity;
      updatedActivity.start_time = new Date(updatedActivity.start_time);
      updatedActivity.id = activity.id;
      // Note updatedAcitivy won't have dirty set
      success(updatedActivity);
    } else {
      failure();
    }
  });
};

var requestUpdateActivity = function(user, activity, activityChanges, success, failure) {
  alert(activity)
  sendRequest('/../v1/activities/'+activity.activity_id+'/', 'post', JSON.stringify(activityChanges), user, function () {
    if(this.status >= 200 && this.status < 400) {
      var updatedActivity = JSON.parse(this.responseText).activity;
      updatedActivity.start_time = new Date(updatedActivity.start_time);
      updatedActivity.id = activity.id;
      success(updatedActivity);
    } else {
      failure();
    }
  });
};

var requestCancelActivity = function (user, activity, success, failure) {
  sendRequest('/../v1/activities/'+activity.activity_id+'/cancel/', 'post', '', user, function () {
    if(this.status >= 200 && this.status < 400) {
      success(activity);
    } else {
      failure();
    }
  })
};

var requestCreatePushNotificationsSubscription = function (user, subscription) {
  console.log(subscription, JSON.stringify(subscription));
  sendRequest('/../v1/push_subscriptions/', 'post', JSON.stringify(subscription), user, function () {});
};

var sendRequest = function (url, method, body, user, onload) {
  var req = new XMLHttpRequest();
  req.onload = onload;
  req.open(method, url, true);
  // The user isn't logged in when they are logging in
  if (user) {
    req.setRequestHeader('Session-Token', user.sessionToken);
    req.setRequestHeader('User-Id', user.userId);
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
  requestActivitiesFromServer,
  requestCreateActivity,
  requestSetAttending,
  requestUpdateActivity,
  requestCancelActivity,
  requestCreatePushNotificationsSubscription,
  requestLogin
};
