from tapalong_app.models import User, Activity, Session
from django.utils import simplejson as json
from django.utils.timezone import utc
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.template import RequestContext, loader
from pyfb import Pyfb
from django.conf import settings
import random
import math
import datetime
import sessions

# Serializes a single activity into JSON, passing along the following:
# Title, start time, description, location, max attendees
def serialize_activity(activity, user_id):
	print activity.creator_id, user_id
	# No idea why user_id is acting as a str here.
	if activity.creator_id == int(user_id):
		is_creator = "true"
	else:
		is_creator = "false"
	
	return {"activity": {"is_creator": is_creator, "title": activity.title, "start_time": str(activity.start_time), "description": activity.description, "location": activity.location, "max_attendees": activity.max_attendees}}

# On GET: Returns all events for the given user. Events are
# returned in order of creation; youngest to oldest.
# On POST: Accepts and stores a new activity
# TODO @allygale: Will need to convert start time from str 
# to datetime, fix creator_id always being 1 (post fb-auth),
# check to make sure user exists?
@csrf_exempt
def get_activities_list(request, user_id):
	facebook = Pyfb(settings.FACEBOOK_APP_ID)
	#Sets the authentication token
	facebook.set_access_token('CAACff4vZA7iEBAPHLyn1rUCfTAo37ZAVbSOovDOLNeY5WTLbttvmh6tiMElyZAdfYrKtx3RWEOvFtWTe6yZCZBYdERMvduzzW73QCWYKsz0xI8B75slb3rgZBwZCYKez5cSWOGdkIFpLMkG9ZAd03oULo5wOfMBkZA84irsPv4DUQQQrDGB9C9eCk')
	#Gets info about myself 
	me = facebook.get_myself()
	print "-" * 40
	print "Name: %s" % me.name

	if request.method == 'GET':
		# Get all activities for which this user is an attendee of.
		# (Includes events they created.)
		user_activities_list = Activity.objects.filter(attendees=user_id).order_by('-pub_date')
		# Serialized and output to json.
		serialized_activities = [serialize_activity(a, user_id) for a in user_activities_list]
		json_output = json.dumps(serialized_activities)
		return HttpResponse(json_output, mimetype='application/json')
	elif request.method == 'POST':
		# Get current time for activity creation timestamp
		now = datetime.datetime.utcnow().replace(tzinfo=utc)
		# Get request data
		activity_info=request.POST
		activity = Activity(creator_id=1, title=activity_info.get("title"), start_time=now, description=activity_info.get("description"), location=activity_info.get("location"), max_attendees=activity_info.get("max_attendees"))
		activity.save()
		activity.attendees.add(User.objects.get(id=1))
		activity.save()
		# Go through each activity and populate its attendees set
		# activity_attendees = activity_info.get("attendees")
		# for user_id in activity_attendees:
		# 	user = User.objects.get(id=user_id)
		# 	activity.attendees.add(user)
		# activity.save()
		serialized_activity = serialize_activity(activity, user_id)
		json_output = json.dumps(serialized_activity)
		return HttpResponse(json_output, mimetype='application/json')