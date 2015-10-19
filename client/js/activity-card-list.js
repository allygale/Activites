// Require react, convenience libraries and UI components
var React = require('react');
var m = require('./m.js');
var ActivityCard = require('./activity-card.js');

// Require core logic
var models = require('./models.js');

var ActivityCardList = React.createClass({

  getInitialState: function () {
    return {
      selectedActivity: undefined
    }
  },

  render: function () {
    var activitiesList = models.activities.getActivities().map((activity) => {
      return (
        <ActivityCard
          activity = { activity }
          onClick = { this.handleActivityClick }
          onAttendClick = { this.handleAttendClick }
          onEditClick = { this.handleEditClick }
          selected = {
            !!this.state.selectedActivity &&
            this.state.selectedActivity.id == activity.id
          }
          key = { activity.id }
        />
      );
    });
    return (
      <div>
        { activitiesList }
      </div>
    );
  },

  handleActivityClick: function (activity) {
    // If something is selected, and it's the activity clicked...
    if (this.state.selectedActivity &&
        this.state.selectedActivity.id == activity.id) {
      this.setState({selectedActivity: undefined});
    } else {
      this.setState({selectedActivity: activity});
    }
  },

  handleEditClick: function (activity) {
    this.props.onEditClick(activity);
  },

  handleAttendClick: function (activity) {
    this.props.onAttendClick(activity);
  }

});

module.exports = ActivityCardList;
