from ..api_service.app.clients import OSMClient


client = OSMClient()

x, y = client.get_coordinates_from_address("1600 Amphitheatre Parkway, Mountain View, CA")

print(f"Coordinates: Latitude {x}, Longitude {y}")