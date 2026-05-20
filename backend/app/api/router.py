# backend/app/api/router.py
from fastapi import APIRouter
from app.api.endpoints import products, orders, auth, reviews, admin , flash_sales, cart


api_router = APIRouter()
api_router.include_router(products.router, prefix="/products", tags=["Products"])
api_router.include_router(orders.router, prefix="/orders", tags=["Orders"])
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["Reviews"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])
api_router.include_router(flash_sales.router, prefix="/flash-sales", tags=["Flash Sales"])
api_router.include_router(cart.router, prefix="/cart", tags=["Cart"])