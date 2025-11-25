from django.urls import path
from . import views
from .views import exportar_clientes_csv

urlpatterns = [
    path('', views.home, name='home'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('dashboard/', views.dashboard_view, name='dashboard'),
    path('perfil/', views.perfil_view, name='perfil'),
    path('clientes/', views.clientes_view, name='clientes'),
    path('fornecedores/', views.fornecedores_view, name='fornecedores'),
    path('funcionarios/', views.funcionarios_view, name='funcionarios'),
    path('produtos/', views.produtos_view, name='produtos'),
    path('vendas/', views.vendas_view, name='vendas'),
    path('exportar_clientes_csv/', exportar_clientes_csv, name='exportar_clientes_csv'),
]