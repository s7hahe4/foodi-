from django.db import models

class SiteSettings(models.Model):
    promo_banner_text = models.CharField(max_length=500, blank=True, default="✨ Use code LUNCH50 to get Tk 60 off on orders over Tk 150 | Available between 12pm - 6pm")

    def save(self, *args, **kwargs):
        # Ensure only one record exists
        self.pk = 1
        super(SiteSettings, self).save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, created = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return "Global Site Settings"
