from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from restaurants.models import Restaurant, Review
from menu.models import MenuItem, Order, OrderItem
from decimal import Decimal

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds initial demo accounts, restaurants, menu items, and reviews for showcase'

    def handle(self, *args, **kwargs):
        self.stdout.write("Starting demo data seeding...")

        # 1. Admin Account
        admin, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@foodiplus.com',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
                'phone_number': '01700000001',
                'address': 'Foodi++ HQ, Gulshan-2, Dhaka'
            }
        )
        admin.set_password('AdminPassword123!')
        admin.role = 'admin'
        admin.is_staff = True
        admin.is_superuser = True
        admin.save()
        self.stdout.write(self.style.SUCCESS("[OK] Admin created: admin / AdminPassword123!"))

        # 2. Restaurant Owner Account
        owner, created = User.objects.get_or_create(
            username='restaurant_owner',
            defaults={
                'email': 'owner@foodiplus.com',
                'role': 'owner',
                'phone_number': '01700000002',
                'address': 'Banani 11, Dhaka'
            }
        )
        owner.set_password('OwnerPassword123!')
        owner.role = 'owner'
        owner.save()
        self.stdout.write(self.style.SUCCESS("[OK] Owner created: restaurant_owner / OwnerPassword123!"))

        # 3. Create / Update Restaurant for Owner
        restaurant, created = Restaurant.objects.get_or_create(
            owner=owner,
            defaults={
                'name': 'Kazi Gourmet Kitchen',
                'description': 'Handcrafted artisanal burgers, stone-baked pizzas, and crispy chicken.',
                'area': 'Banani',
                'city': 'Dhaka',
                'address': 'Road 11, Block D, Banani, Dhaka',
                'status': 'approved',
                'is_verified': True,
                'is_open': True,
                'delivery_fee': Decimal('35.00'),
                'latitude': Decimal('23.7937'),
                'longitude': Decimal('90.4042')
            }
        )
        restaurant.status = 'approved'
        restaurant.is_verified = True
        restaurant.is_open = True
        restaurant.save()
        self.stdout.write(self.style.SUCCESS("[OK] Restaurant created: Kazi Gourmet Kitchen"))

        # 4. Menu Items
        menu_items_data = [
            {
                'name': 'Double Bacon Cheeseburger Deluxe',
                'description': 'Two 100% prime beef patties, smoked melted cheddar, caramelized onions, house special secret sauce.',
                'price': Decimal('320.00'),
                'category': 'Burgers',
                'calories': 680
            },
            {
                'name': 'Crispy Peri Peri Chicken Tender Box',
                'description': 'Golden fried boneless chicken breast tossed in spicy African peri peri seasoning with garlic dip.',
                'price': Decimal('260.00'),
                'category': 'Crispy Chicken',
                'calories': 520
            },
            {
                'name': 'Stone-Baked Truffle Mushroom Pizza',
                'description': 'Thin crust sourdough with mozzarella, sautéed wild mushrooms, white truffle oil, and fresh basil.',
                'price': Decimal('520.00'),
                'category': 'Pizza',
                'calories': 810
            },
            {
                'name': 'Spicy Mexican Loaded Cheese Fries',
                'description': 'Crispy skin-on french fries topped with jalapeño queso, spicy minced beef, and green onions.',
                'price': Decimal('190.00'),
                'category': 'Appetizers',
                'calories': 440
            },
            {
                'name': 'Chilled Mint Limeade Cooler',
                'description': 'Freshly squeezed limes blended with garden mint, sparkling water, and crushed ice.',
                'price': Decimal('85.00'),
                'category': 'Beverages',
                'calories': 110
            }
        ]

        for item_data in menu_items_data:
            item, _ = MenuItem.objects.get_or_create(
                restaurant=restaurant,
                name=item_data['name'],
                defaults={
                    'description': item_data['description'],
                    'price': item_data['price'],
                    'category': item_data['category'],
                    'calories': item_data['calories'],
                    'is_available': True
                }
            )

        self.stdout.write(self.style.SUCCESS("[OK] 5 signature menu items created."))

        # 5. Delivery Rider Account
        rider, created = User.objects.get_or_create(
            username='delivery_rider',
            defaults={
                'email': 'rider@foodiplus.com',
                'role': 'rider',
                'phone_number': '01700000003',
                'address': 'Mohakhali DOHS, Dhaka'
            }
        )
        rider.set_password('RiderPassword123!')
        rider.role = 'rider'
        rider.save()
        self.stdout.write(self.style.SUCCESS("[OK] Rider created: delivery_rider / RiderPassword123!"))

        # 6. Customer Account
        customer, created = User.objects.get_or_create(
            username='customer_demo',
            defaults={
                'email': 'customer@foodiplus.com',
                'role': 'customer',
                'phone_number': '01700000004',
                'address': 'House 12, Road 4, Dhanmondi, Dhaka'
            }
        )
        customer.set_password('CustomerPassword123!')
        customer.role = 'customer'
        customer.save()
        self.stdout.write(self.style.SUCCESS("[OK] Customer created: customer_demo / CustomerPassword123!"))

        # 7. Sample Delivered Order & 5-Star Review
        first_item = MenuItem.objects.filter(restaurant=restaurant).first()
        if first_item:
            order, o_created = Order.objects.get_or_create(
                customer=customer,
                restaurant=restaurant,
                defaults={
                    'rider': rider,
                    'total_price': Decimal('355.00'),
                    'delivery_fee': Decimal('35.00'),
                    'status': 'Delivered',
                    'is_paid': True
                }
            )
            order.status = 'Delivered'
            order.is_paid = True
            order.save()

            OrderItem.objects.get_or_create(
                order=order,
                menu_item=first_item,
                defaults={
                    'quantity': 1
                }
            )

            # Review
            Review.objects.update_or_create(
                order=order,
                defaults={
                    'customer': customer,
                    'restaurant': restaurant,
                    'rating': 5,
                    'comment': 'Sensational burger! Arrived hot in less than 25 minutes. Highly recommended!'
                }
            )
            restaurant.update_rating()
            self.stdout.write(self.style.SUCCESS("[OK] Sample order and 5-star review created!"))

        self.stdout.write(self.style.SUCCESS("All demo data seeded successfully!"))
