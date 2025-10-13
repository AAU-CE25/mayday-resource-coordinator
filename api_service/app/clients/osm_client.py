import requests

class OSMClient:
    BASE_URL = "https://nominatim.openstreetmap.org/search"

    @staticmethod
    def get_coordinates_from_address(address: str):
        params = {
            "q": address,
            "format": "json",
            "limit": 1
        }
        headers = {"User-Agent": "MyApp/1.0"}

        response = requests.get(OSMClient.BASE_URL, params=params, headers=headers)
        response.raise_for_status()

        data = response.json()
        if not data:
            return None

        return float(data[0]["lat"]), float(data[0]["lon"])
    @staticmethod
    def get_address_from_coordinates(lat: float, lon: float):
        params = {
            "lat": lat,
            "lon": lon,
            "format": "json"
        }
        headers = {"User-Agent": "MyApp/1.0"}

        response = requests.get("https://nominatim.openstreetmap.org/reverse", params=params, headers=headers)
        response.raise_for_status()

        data = response.json()
        if "error" in data:
            return None

        return data.get("address", {})
