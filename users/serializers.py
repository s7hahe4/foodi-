from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    """Used during signup — password is write-only and gets hashed."""
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'role', 'phone_number']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            role=validated_data.get('role', 'customer'),
            phone_number=validated_data.get('phone_number', '')
        )
        return user


# Keep old name as alias so nothing else breaks if it's referenced elsewhere
UserRegisterSerializer = RegisterSerializer


class UserSerializer(serializers.ModelSerializer):
    """Used for reading/displaying user data — includes restriction fields."""
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'role',
            'phone_number', 'address',
            'is_active', 'is_restricted', 'restriction_reason',
            'date_joined',
        ]
        read_only_fields = ['date_joined']