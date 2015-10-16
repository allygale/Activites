from django.db import models
from django.utils.timezone import utc
import datetime

class User(models.Model):
	name = models.CharField(max_length = 40, blank=False)
	password = models.CharField(max_length = 30)
	fb_id = models.BigIntegerField(blank=False)
	friends = models.TextField(default='')

	def __unicode__(self):
		return self.name

	def image_url(self):
		return 'http://graph.facebook.com/'+str(self.fb_id)+'/picture'

	def large_image_url(self):
		return self.image_url() + '?type=large'

class Activity(models.Model):
	# Many-to-one relationship with User
	creator = models.ForeignKey(User, related_name='event_set', blank=False)
	pub_date = models.DateTimeField(auto_now_add=True)
	start_time = models.DateTimeField(blank=False)
	title = models.CharField(max_length=60, blank=False)
	description = models.CharField(max_length=1024, default='')
	attendees = models.ManyToManyField(User, related_name='attending_set')
	location = models.CharField(max_length=60)
	# 0 will represent no max here.
	max_attendees = models.IntegerField(default=0)

	def __unicode__(self):
		return self.title

class Session(models.Model):
	token = models.BigIntegerField()
	user = models.ForeignKey(User)
	created_at = models.DateTimeField(auto_now_add=True, blank=False)
	expires_at = models.DateTimeField(blank=False)

	# Use this to check whether it has expired yet
	def has_expired(self):
		now = datetime.datetime.utcnow().replace(tzinfo=utc)
		assert (self.created_at < now);
		return (now > self.expires_at)

class Notification(models.Model):
	user = models.ForeignKey(User, related_name='notification_set', blank=False)
	template = models.CharField(max_length=60, blank=False)
	# This is serialized JSON
	options = models.TextField(default='')
	dismissed = models.BooleanField(default=False)
	expired = models.BooleanField(default=False)

	def __unicode__(self):
		return 'Notificaiton object: ' + self.template + ' for ' + self.user.name

class PushSubscription(models.Model):
	recipient = models.ForeignKey(User, related_name='push_subscription_set', blank=False)
	subscription_id = models.CharField(max_length=300, blank=False)
	created_at = models.DateTimeField(auto_now_add=True)
	expired_at = models.DateTimeField(null=True, blank=True)