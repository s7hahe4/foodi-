from rest_framework import permissions

class IsSystemAdmin(permissions.BasePermission):
    """
    Allows access only to the platform admin (Shahed's God Account).
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'admin'
        )

class IsRestaurantOwner(permissions.BasePermission):
    """
    Allows access only to Restaurant Owners.
    Used for Menu Management and Restaurant Setup.
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'owner'
        )

class IsRider(permissions.BasePermission):
    """
    Allows access only to Delivery Riders.
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'rider'
        )