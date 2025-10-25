from __future__ import annotations

import asyncio
import sys
from pathlib import Path
from typing import Final, TypedDict

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models.branch import Branch


class BranchSeed(TypedDict):
    name: str
    city: str
    code: str
    latitude: float | None
    longitude: float | None


BRANCHES: Final[list[BranchSeed]] = [
    {"name": "CBC Honda – Bhasi Nagar", "city": "Thiruvananthapuram", "code": "TVM-CBC-BHASI", "latitude": 8.5285, "longitude": 76.9389},
    {"name": "CBC Honda – Venjaramoodu", "city": "Thiruvananthapuram", "code": "TVM-CBC-VENJ", "latitude": 8.7532, "longitude": 76.9146},
    {"name": "A V Motors", "city": "Thiruvananthapuram", "code": "TVM-AVMOTORS", "latitude": 8.4901, "longitude": 76.9531},
    {"name": "City Honda", "city": "Thiruvananthapuram", "code": "TVM-CITY", "latitude": 8.5245, "longitude": 76.936},
    {"name": "EVM Honda – Neyyattinkara", "city": "Thiruvananthapuram", "code": "TVM-EVM-NEY", "latitude": 8.3983, "longitude": 77.0852},
    {"name": "Vayalat Honda", "city": "Kochi", "code": "EKM-VAYALAT", "latitude": 9.987, "longitude": 76.2865},
    {"name": "EVM Honda – Vyttila", "city": "Kochi", "code": "EKM-EVM-VYT", "latitude": 9.9705, "longitude": 76.3188},
    {"name": "Muthoot Honda – Palarivattom", "city": "Kochi", "code": "EKM-MUTHOOT-PAL", "latitude": 9.9816, "longitude": 76.3074},
    {"name": "Arya Bhangy Honda", "city": "Ernakulam", "code": "EKM-ARYA", "latitude": 9.9795, "longitude": 76.2833},
    {"name": "Nikkoy Honda – Puthiyara", "city": "Kozhikode", "code": "CLT-NIKKOY", "latitude": 11.2588, "longitude": 75.7804},
    {"name": "KTC Honda – YMCA Road", "city": "Kozhikode", "code": "CLT-KTC-YMCA", "latitude": 11.2595, "longitude": 75.7819},
    {"name": "Aditya Honda – Vellayil", "city": "Kozhikode", "code": "CLT-ADITYA-VEL", "latitude": 11.2744, "longitude": 75.7794},
    {"name": "Vahini Honda – Kollam", "city": "Kollam", "code": "KLM-VAHINI-MAIN", "latitude": 8.8932, "longitude": 76.6141},
    {"name": "Vahini Honda – Karunagappally", "city": "Karunagappally", "code": "KLM-VAHINI-KAR", "latitude": 9.0628, "longitude": 76.543},
    {"name": "Vahini Honda – Parippally", "city": "Parippally", "code": "KLM-VAHINI-PAR", "latitude": 8.8084, "longitude": 76.7638},
    {"name": "Muthoot Automotive – BigWing Kollam", "city": "Kollam", "code": "KLM-MUTHOOT-BW", "latitude": 8.8855, "longitude": 76.586},
    {"name": "Johns Honda – Puzhakkal", "city": "Thrissur", "code": "TSR-JOHNS-PUZ", "latitude": 10.5651, "longitude": 76.196},
    {"name": "Honda BigWing Thrissur North", "city": "Thrissur", "code": "TSR-BIGWING-N", "latitude": 10.5327, "longitude": 76.2141},
    {"name": "Trichur Honda", "city": "Thrissur", "code": "TSR-TRICHUR", "latitude": 10.5201, "longitude": 76.2144},
    {"name": "Purackal Honda – Changanassery", "city": "Changanassery", "code": "KTM-PURACKAL-CHN", "latitude": 9.4429, "longitude": 76.5448},
    {"name": "Jay Jay Honda", "city": "Kottayam", "code": "KTM-JAYJAY", "latitude": 9.5916, "longitude": 76.5221},
    {"name": "Panachamoottil Honda", "city": "Thiruvalla", "code": "PTA-PANACHAM", "latitude": 9.3866, "longitude": 76.5731},
    {"name": "Kollikara Honda", "city": "Kasaragod", "code": "KSD-KOLLIKARA", "latitude": 12.4993, "longitude": 74.9896},
    {"name": "Aditya Honda – Kannur", "city": "Kannur", "code": "KAN-ADITYA-MAIN", "latitude": 11.8745, "longitude": 75.3704},
    {"name": "Zodiac Motors", "city": "Kollam", "code": "KLM-ZODIAC", "latitude": 8.88, "longitude": 76.605},
    {"name": "Johns Honda – Chavakkad", "city": "Chavakkad", "code": "TSR-JOHNS-CHV", "latitude": 10.5837, "longitude": 76.0244},
]


async def seed_branches() -> None:
    async with AsyncSessionLocal() as session:
        for branch_data in BRANCHES:
            result = await session.execute(select(Branch).where(Branch.code == branch_data["code"]))
            branch = result.scalar_one_or_none()
            if branch:
                branch.name = branch_data["name"]
                branch.city = branch_data["city"]
                branch.latitude = branch_data["latitude"]
                branch.longitude = branch_data["longitude"]
            else:
                session.add(Branch(**branch_data))
        await session.commit()


if __name__ == "__main__":
    asyncio.run(seed_branches())
